import express from 'express';
import multer from 'multer';
import axios from 'axios';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import { upscaleLive3d } from './upscalers/live3d.js';
import { upscaleSwiftspeed } from './upscalers/swiftspeed.js';
import { imageInfo, isSupportedImage } from './imageinfo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_BYTES = 12 * 1024 * 1024;

/**
 * Membuat aplikasi Express. Dipakai dua tempat:
 *   - server/index.js  (dev / self-host: memanggil app.listen)
 *   - api/index.js      (Vercel: mengekspor app sebagai serverless function)
 *
 * Penting untuk Vercel: TIDAK ada state di memori antar-permintaan.
 * Fungsi serverless bersifat sementara dan bisa beda instans, jadi hasil
 * dikirim langsung ke browser sebagai data URL di dalam stream, bukan
 * disimpan lalu diambil lewat endpoint kedua.
 *
 * Progres dan galat dikirim sebagai KODE stabil (mis. 'sending', 'queue'),
 * bukan kalimat. Frontend yang menerjemahkannya, jadi backend tetap netral
 * bahasa dan UI bisa ID/EN tanpa mengubah server.
 */
export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES, files: 1 },
  });

  const ENGINES = {
    fast: { label: 'Live3D', run: upscaleLive3d },
    quality: { label: 'Swiftspeed', run: upscaleSwiftspeed },
  };

  /**
   * Penyuntikan kegagalan untuk menguji jalur fallback.
   * Hanya aktif bila NOISY_FAULT diisi, jadi tidak berpengaruh di produksi.
   * Contoh: NOISY_FAULT=fast node server/index.js
   */
  const FAULT = process.env.NOISY_FAULT;
  if (FAULT && ENGINES[FAULT]) {
    ENGINES[FAULT] = {
      ...ENGINES[FAULT],
      run: async () => {
        throw new Error('Kegagalan yang disuntikkan untuk pengujian');
      },
    };
    console.warn(`[uji] Engine "${FAULT}" dipaksa gagal lewat NOISY_FAULT`);
  }

  const SAMPLE_HOSTS = new Set(['picsum.photos', 'fastly.picsum.photos']);

  async function fetchSample(rawUrl) {
    let parsed;
    try {
      parsed = new URL(rawUrl);
    } catch {
      throw new AppError('badSample');
    }
    if (parsed.protocol !== 'https:' || !SAMPLE_HOSTS.has(parsed.hostname)) {
      throw new AppError('sampleNotAllowed');
    }
    const res = await axios.get(parsed.toString(), {
      responseType: 'arraybuffer',
      timeout: 30_000,
      maxContentLength: MAX_BYTES,
    });
    return Buffer.from(res.data);
  }

  /* ---------------------------------------------------------------
     POST /api/upscale
     Menerima multipart (field "image") atau JSON { sampleUrl }.
     Membalas NDJSON: satu objek JSON per baris, supaya progres yang
     dilaporkan ke UI adalah tahapan nyata dari engine, bukan animasi palsu.
     Baris terakhir (type 'done') memuat hasil sebagai data URL.
     --------------------------------------------------------------- */
  app.post('/api/upscale', upload.single('image'), async (req, res) => {
    res.status(200);
    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Accel-Buffering', 'no');

    let closed = false;
    res.on('close', () => {
      closed = true;
    });

    const send = (payload) => {
      if (!closed && !res.writableEnded) res.write(JSON.stringify(payload) + '\n');
    };

    const started = Date.now();

    try {
      const scale = Number(req.body?.scale) === 2 ? 2 : 4;
      const requested = req.body?.engine === 'quality' ? 'quality' : 'fast';

      let source;
      let sourceName = 'gambar';

      if (req.file) {
        source = req.file.buffer;
        sourceName = req.file.originalname || 'gambar';
      } else if (req.body?.sampleUrl) {
        send({ type: 'progress', pct: 6, code: 'fetchingSample' });
        source = await fetchSample(req.body.sampleUrl);
        sourceName = 'contoh.jpg';
      } else {
        throw new AppError('noImage');
      }

      if (!source?.length) throw new AppError('empty');
      if (source.length > MAX_BYTES) throw new AppError('tooLarge');
      if (!isSupportedImage(source)) throw new AppError('unsupported');

      const input = imageInfo(source);
      send({ type: 'input', input, name: sourceName, scale, engine: requested });
      send({ type: 'progress', pct: 8, code: 'received' });

      const order = requested === 'fast' ? ['fast', 'quality'] : ['quality', 'fast'];
      let outcome = null;
      const failures = [];

      for (const [index, key] of order.entries()) {
        const engine = ENGINES[key];
        if (index > 0) {
          send({ type: 'progress', pct: 10, code: 'switching', engineLabel: engine.label });
        }
        try {
          outcome = await engine.run(source, scale, (pct, code) =>
            send({ type: 'progress', pct, code }),
          );
          break;
        } catch (err) {
          failures.push(`${engine.label}: ${err.message}`);
          if (closed) return;
        }
      }

      if (!outcome) {
        console.error('[upscale] semua engine gagal:', failures.join(' | '));
        throw new AppError('allFailed');
      }

      // Ambil hasil dari engine untuk diukur dimensi & ukuran nyatanya,
      // lalu kirim langsung ke browser sebagai data URL (tanpa state server).
      const fetched = await axios.get(outcome.url, {
        responseType: 'arraybuffer',
        timeout: 60_000,
        maxContentLength: 80 * 1024 * 1024,
      });
      const outBuffer = Buffer.from(fetched.data);
      const output = imageInfo(outBuffer);

      const ext = output.format === 'webp' ? 'webp' : output.format === 'jpeg' ? 'jpg' : 'png';
      // MIME diturunkan dari format hasil pembacaan magic bytes, bukan dari
      // header CDN — sebagian CDN (mis. temp.live3d.io) menyajikan WebP dengan
      // Content-Type: image/jpeg yang keliru. Magic bytes lebih dapat dipercaya.
      const contentType =
        ext === 'webp' ? 'image/webp' : ext === 'jpg' ? 'image/jpeg' : 'image/png';
      const base =
        String(sourceName).replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-') || 'gambar';

      send({ type: 'progress', pct: 100, code: 'done' });
      send({
        type: 'done',
        url: `data:${contentType};base64,${outBuffer.toString('base64')}`,
        downloadName: `${base}-noisy-${scale}x.${ext}`,
        engine: outcome.engine,
        engineLabel: ENGINES[outcome.engine === 'live3d' ? 'fast' : 'quality'].label,
        fellBack: failures.length > 0,
        scale,
        input,
        output,
        ms: Date.now() - started,
      });
    } catch (err) {
      send({
        type: 'error',
        code: err instanceof AppError ? err.code : 'generic',
        message: err.message || 'Proses gagal',
      });
    } finally {
      if (!res.writableEnded) res.end();
    }
  });

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  /* Produksi self-host: sajikan hasil build. Di Vercel, statis ditangani
     platform, jadi blok ini hanya aktif kalau folder dist ada. */
  const dist = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(dist, 'index.html'));
    });
  }

  // Penanganan galat multer (mis. berkas terlalu besar) agar tetap berupa JSON.
  app.use((err, _req, res, _next) => {
    const code = err?.code === 'LIMIT_FILE_SIZE' ? 'tooLarge' : 'generic';
    if (res.headersSent) return res.end();
    res.status(400).json({ error: err?.message || 'Galat server', code });
  });

  return app;
}

/** Galat yang membawa kode stabil untuk diterjemahkan di frontend. */
class AppError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
