/**
 * Uji end-to-end terhadap server yang sedang berjalan.
 * Meniru persis yang dilakukan browser: multipart unggah + baca stream NDJSON.
 * Jalankan: node scripts/e2e.js
 */
const BASE = process.env.BASE || 'http://localhost:8787';

async function streamUpscale({ label, buffer, filename, sampleUrl, scale, engine }) {
  const form = new FormData();
  form.append('scale', String(scale));
  form.append('engine', engine);
  if (buffer) form.append('image', new Blob([buffer], { type: 'image/jpeg' }), filename);
  else form.append('sampleUrl', sampleUrl);

  const started = Date.now();
  const res = await fetch(`${BASE}/api/upscale`, { method: 'POST', body: form });

  if (!res.ok) {
    const text = await res.text();
    return { label, ok: false, error: `HTTP ${res.status}: ${text.slice(0, 160)}` };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const stages = [];
  let done = null;
  let error = null;

  while (true) {
    const { done: finished, value } = await reader.read();
    if (finished) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.type === 'progress') stages.push(`${event.pct}% ${event.note}`);
      if (event.type === 'done') done = event;
      if (event.type === 'error') error = event.message;
    }
  }

  return { label, ok: Boolean(done), done, error, stages, wall: Date.now() - started };
}

function assert(condition, message) {
  if (condition) {
    console.log(`   PASS  ${message}`);
    return true;
  }
  console.log(`   FAIL  ${message}`);
  process.exitCode = 1;
  return false;
}

(async () => {
  console.log('Mengunduh gambar uji 400x300...');
  const srcRes = await fetch('https://picsum.photos/seed/noisy-e2e/400/300', { redirect: 'follow' });
  const source = Buffer.from(await srcRes.arrayBuffer());
  console.log(`Gambar uji: ${source.length} byte\n`);

  /* ---------- 1. Unggahan berkas, engine cepat, 4x ---------- */
  console.log('[1] Unggah berkas, engine cepat, 4x');
  const fast = await streamUpscale({
    label: 'fast-4x',
    buffer: source,
    filename: 'uji.jpg',
    scale: 4,
    engine: 'fast',
  });

  if (!fast.ok) {
    console.log(`   GAGAL: ${fast.error}`);
  } else {
    const d = fast.done;
    console.log(`   Tahapan: ${fast.stages.length} pembaruan progres`);
    console.log(`   Engine terpakai: ${d.engineLabel} (fallback: ${d.fellBack})`);
    console.log(`   Input : ${d.input.width}x${d.input.height} ${d.input.format} ${d.input.bytes}B`);
    console.log(`   Output: ${d.output.width}x${d.output.height} ${d.output.format} ${d.output.bytes}B`);
    console.log(`   Waktu : ${(d.ms / 1000).toFixed(1)}s`);
    assert(d.input.width === 400 && d.input.height === 300, 'dimensi input terbaca benar');
    assert(d.output.width === 1600 && d.output.height === 1200, 'output tepat 4x (1600x1200)');
    assert(d.output.bytes > 0, 'berkas hasil tidak kosong');
    assert(fast.stages.length >= 3, 'progres dilaporkan bertahap');

    /* ---------- 2. Hasil bisa diambil dan diunduh ---------- */
    console.log('\n[2] Ambil hasil dari /api/result');
    const view = await fetch(`${BASE}${d.url}`);
    const viewBuf = Buffer.from(await view.arrayBuffer());
    assert(view.status === 200, 'endpoint hasil membalas 200');
    assert(viewBuf.length === d.output.bytes, 'ukuran berkas cocok dengan laporan');

    const dl = await fetch(`${BASE}${d.url}?download=1`);
    const disposition = dl.headers.get('content-disposition') || '';
    console.log(`   Content-Disposition: ${disposition}`);
    assert(disposition.includes('attachment'), 'mode unduhan memasang header attachment');
    assert(/noisy-4x\.(webp|png|jpg)/.test(disposition), 'nama berkas unduhan mengandung skala');
  }

  /* ---------- 3. Gambar contoh, 2x ---------- */
  console.log('\n[3] Gambar contoh lewat sampleUrl, 2x');
  const sample = await streamUpscale({
    label: 'sample-2x',
    sampleUrl: 'https://picsum.photos/seed/noisy-arsitektur/420/315',
    scale: 2,
    engine: 'fast',
  });
  if (!sample.ok) {
    console.log(`   GAGAL: ${sample.error}`);
    process.exitCode = 1;
  } else {
    const d = sample.done;
    console.log(`   Output: ${d.output.width}x${d.output.height}, ${(d.ms / 1000).toFixed(1)}s`);
    assert(d.output.width === 840 && d.output.height === 630, 'contoh 2x menghasilkan 840x630');
  }

  /* ---------- 4. Penolakan berkas tak didukung ---------- */
  console.log('\n[4] Tolak berkas bukan gambar');
  const bogus = await streamUpscale({
    label: 'bogus',
    buffer: Buffer.from('ini teks biasa, bukan gambar sama sekali'),
    filename: 'catatan.txt',
    scale: 4,
    engine: 'fast',
  });
  console.log(`   Pesan: ${bogus.error}`);
  assert(!bogus.ok && /didukung|Format/i.test(bogus.error || ''), 'berkas non-gambar ditolak jelas');

  /* ---------- 5. Sumber contoh di luar daftar izin ---------- */
  console.log('\n[5] Tolak sampleUrl di luar daftar izin');
  const ssrf = await streamUpscale({
    label: 'ssrf',
    sampleUrl: 'http://169.254.169.254/latest/meta-data/',
    scale: 4,
    engine: 'fast',
  });
  console.log(`   Pesan: ${ssrf.error}`);
  assert(!ssrf.ok && /tidak diizinkan|tidak valid/i.test(ssrf.error || ''), 'host asing ditolak');

  console.log(`\nSelesai. Status keluar: ${process.exitCode || 0}`);
})();
