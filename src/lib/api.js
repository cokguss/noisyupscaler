/**
 * Klien untuk /api/upscale.
 * Server membalas NDJSON, jadi progres yang tampil di UI mengikuti
 * tahapan nyata dari engine, bukan animasi yang dikarang di browser.
 *
 * Server mengirim KODE tahap/galat (mis. 'sending', 'unsupported'), bukan
 * kalimat. Penerjemahan ke ID/EN terjadi di komponen lewat kamus i18n,
 * jadi backend tetap netral bahasa.
 */

export async function upscale({ file, sampleUrl, scale = 4, engine = 'fast', signal, onEvent }) {
  const body = new FormData();
  body.append('scale', String(scale));
  body.append('engine', engine);
  if (file) body.append('image', file);
  else if (sampleUrl) body.append('sampleUrl', sampleUrl);
  else throw new UpscaleError('noImage');

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
      if (event.type === 'error') throw new UpscaleError(event.code || 'generic');
      if (event.type === 'done') result = event;
      onEvent?.(event);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    flush(decoder.decode(value, { stream: true }));
  }
  flush(decoder.decode());

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
