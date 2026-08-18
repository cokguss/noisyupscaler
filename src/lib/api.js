/**
 * Klien untuk /api/upscale.
 * Server membalas NDJSON, jadi progres yang tampil di UI mengikuti
 * tahapan nyata dari engine, bukan animasi yang dikarang di browser.
 *
 * Server mengirim KODE tahap/galat (mis. 'sending', 'unsupported'), bukan
 * kalimat. Penerjemahan ke ID/EN terjadi di komponen lewat kamus i18n,
 * jadi backend tetap netral bahasa.
 */

// Plafon jumlah piksel hasil. Engine upscaler berjalan LEBIH LAMBAT & lebih
// bervariasi dari data center Vercel (iad1) dibanding mesin lokal; foto ponsel
// biasa (mis. 1809x2560 = 4,6 MP) di 4x menghasilkan ~74 MP yang melewati batas
// 300 dtk fungsi Vercel -> galat "semua engine gagal / kehabisan waktu".
// Terbukti di produksi: memperkecil input agar output <= 32 MP membuat kasus
// yang tadi timeout (218 dtk) selesai dalam ~66 dtk.
const MAX_OUTPUT_PIXELS = 32_000_000;

export async function upscale({ file, sampleUrl, scale = 4, engine = 'fast', signal, onEvent }) {
  if (!file && !sampleUrl) throw new UpscaleError('noImage');

  // Perkecil di sisi klien bila perlu — SEKALI di luar loop retry agar tidak
  // dihitung ulang saat koneksi yang putus dicoba lagi. Hanya berlaku untuk
  // berkas unggahan; contoh (sampleUrl) sudah kecil.
  let upload = file;
  let uploadName;
  if (file) {
    const prepared = await prepareUpload(file, scale);
    upload = prepared.blob;
    uploadName = prepared.name;
    if (prepared.downscaled) onEvent?.({ type: 'optimized', from: prepared.from, to: prepared.to });
  }

  // Koneksi seluler kadang terputus di tengah proses (NAT operator memutus
  // koneksi yang diam, sinyal berkedip, atau tab ditangguhkan). Karena
  // memproses ulang bersifat idempoten dan aman, coba sekali lagi bila stream
  // putus SEBELUM hasil tiba. Galat eksplisit dari server tidak diulang.
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await streamUpscale({
        file: upload,
        fileName: uploadName,
        sampleUrl,
        scale,
        engine,
        signal,
        onEvent,
      });
    } catch (err) {
      // Jangan ulangi bila pengguna membatalkan atau galatnya deterministik.
      if (err.name === 'AbortError' || signal?.aborted) throw err;
      const retriable = err instanceof UpscaleError && err.code === 'disconnected';
      if (!retriable || attempt === 1) throw err;
      lastError = err;
    }
  }
  throw lastError; // tak akan tercapai; jaga-jaga
}

/**
 * Perkecil gambar di sisi klien bila hasil (input x skala^2) akan melebihi
 * MAX_OUTPUT_PIXELS. Selain membuat proses selesai dalam batas waktu Vercel,
 * ini memangkas ukuran unggahan drastis (mis. 2,97 MB -> 340 KB), yang juga
 * menurunkan risiko koneksi seluler terputus saat mengunggah.
 *
 * createImageBitmap dengan imageOrientation 'from-image' MEMBAKAR orientasi
 * EXIF ke piksel, jadi foto ponsel yang berorientasi tidak jadi miring.
 *
 * Kalau apa pun gagal (createImageBitmap tak tersedia, kanvas gagal, dsb.),
 * kembalikan berkas asli — memperkecil itu penyempurnaan, bukan syarat wajib.
 *
 * @returns {Promise<{blob: Blob, name?: string, downscaled: boolean,
 *   from?: {width:number,height:number}, to?: {width:number,height:number}}>}
 */
async function prepareUpload(file, scale) {
  const original = { blob: file, name: file.name, downscaled: false };
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return original;
  }
  let bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const inW = bmp.width;
    const inH = bmp.height;
    const outPixels = inW * inH * scale * scale;
    if (outPixels <= MAX_OUTPUT_PIXELS) return original;

    // Perkecil input agar (input x skala^2) tepat menyentuh plafon.
    const factor = Math.sqrt(MAX_OUTPUT_PIXELS / outPixels);
    const w = Math.max(1, Math.round(inW * factor));
    const h = Math.max(1, Math.round(inH * factor));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return original;
    ctx.imageSmoothingQuality = 'high';
    // Latar putih dulu: JPEG tak punya alpha, jadi area transparan pada PNG
    // akan jadi hitam bila tak diisi. Putih adalah default yang paling aman.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    if (!blob) return original;

    const base = (file.name || 'gambar').replace(/\.[^.]+$/, '');
    return {
      blob,
      name: `${base}.jpg`,
      downscaled: true,
      from: { width: inW, height: inH },
      to: { width: w, height: h },
    };
  } catch {
    return original;
  } finally {
    bmp?.close?.();
  }
}

async function streamUpscale({ file, fileName, sampleUrl, scale, engine, signal, onEvent }) {
  const body = new FormData();
  body.append('scale', String(scale));
  body.append('engine', engine);
  // Sertakan nama hanya bila kita punya (blob hasil perkecilan). Untuk File
  // asli, biarkan FormData memakai file.name; meneruskan undefined bisa jadi
  // string "undefined" di sebagian mesin.
  if (file) {
    if (fileName) body.append('image', file, fileName);
    else body.append('image', file);
  } else {
    body.append('sampleUrl', sampleUrl);
  }

  const res = await fetch('/api/upscale', { method: 'POST', body, signal });

  if (!res.ok || !res.body) {
    // Galat sebelum stream dimulai (mis. berkas ditolak multer) dibalas sebagai JSON.
    let code = 'rejected';
    let status = res.status;
    try {
      const data = await res.json();
      if (data?.code) code = data.code;
    } catch {
      /* biarkan kode bawaan */
    }
    throw new UpscaleError(code, { status });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;

  const flush = (chunk) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      let event;
      try {
        event = JSON.parse(trimmed);
      } catch {
        continue;
      }
      // Detak jantung dari server hanya untuk menjaga koneksi hidup; abaikan.
      if (event.type === 'ping') continue;
      if (event.type === 'error') throw new UpscaleError(event.code || 'generic');
      if (event.type === 'done') result = event;
      onEvent?.(event);
    }
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      flush(decoder.decode(value, { stream: true }));
    }
    flush(decoder.decode());
  } catch (err) {
    // Pembacaan stream gagal di tengah jalan (koneksi putus di mobile).
    if (err instanceof UpscaleError) throw err;
    if (err?.name === 'AbortError' || signal?.aborted) throw err;
    throw new UpscaleError('disconnected');
  }

  if (!result) throw new UpscaleError('disconnected');
  return result;
}

/** Galat yang membawa kode stabil untuk diterjemahkan di komponen. */
export class UpscaleError extends Error {
  constructor(code, meta = {}) {
    super(code);
    this.code = code;
    this.meta = meta;
  }
}

export function formatBytes(bytes, lang = 'id') {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  // Indonesia memakai koma sebagai pemisah desimal.
  return `${lang === 'id' ? mb.replace('.', ',') : mb} MB`;
}

export function formatSeconds(ms, lang = 'id') {
  if (!Number.isFinite(ms)) return '-';
  const s = (ms / 1000).toFixed(1);
  const unit = lang === 'id' ? 'detik' : 's';
  return `${lang === 'id' ? s.replace('.', ',') : s} ${unit}`;
}

export function formatDimensions(info, lang = 'id') {
  if (!info?.width || !info?.height) return lang === 'id' ? 'tidak terbaca' : 'unreadable';
  return `${info.width} x ${info.height}`;
}
