/**
 * Verifikasi engine kualitas (Swiftspeed) dan jalur fallback otomatis.
 * Fallback diuji dengan menyuntikkan kegagalan lewat NOISY_FAULT.
 * Jalankan: node scripts/e2e-fallback.js
 */
const BASE = process.env.BASE || 'http://localhost:8787';

async function run({ scale, engine }) {
  const srcRes = await fetch('https://picsum.photos/seed/noisy-e2e/400/300', { redirect: 'follow' });
  const source = Buffer.from(await srcRes.arrayBuffer());

  const form = new FormData();
  form.append('scale', String(scale));
  form.append('engine', engine);
  form.append('image', new Blob([source], { type: 'image/jpeg' }), 'uji.jpg');

  const res = await fetch(`${BASE}/api/upscale`, { method: 'POST', body: form });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  const notes = [];
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
      if (event.type === 'progress') notes.push(event.note);
      if (event.type === 'done') done = event;
      if (event.type === 'error') error = event.message;
    }
  }
  return { done, error, notes };
}

function assert(condition, message) {
  console.log(`   ${condition ? 'PASS' : 'FAIL'}  ${message}`);
  if (!condition) process.exitCode = 1;
}

(async () => {
  const fault = process.env.NOISY_FAULT;
  console.log(`Server fault injection: ${fault || 'nonaktif'}\n`);

  if (fault === 'live3d') {
    console.log('[Fallback] Engine cepat dipaksa gagal, harus beralih ke Swiftspeed');
    const r = await run({ scale: 4, engine: 'fast' });
    if (!r.done) {
      console.log(`   GAGAL: ${r.error}`);
      process.exitCode = 1;
      return;
    }
    console.log(`   Engine terpakai: ${r.done.engineLabel}`);
    console.log(`   Output: ${r.done.output.width}x${r.done.output.height} ${r.done.output.format}`);
    assert(r.done.fellBack === true, 'hasil ditandai sebagai fallback');
    assert(r.done.engine === 'swiftspeed', 'engine cadangan yang dipakai adalah Swiftspeed');
    assert(
      r.notes.some((n) => /cadangan/i.test(n)),
      'pengguna diberi tahu saat beralih engine',
    );
    assert(r.done.output.width === 1600, 'hasil fallback tetap 4x');
    console.log(`\nSelesai. Status keluar: ${process.exitCode || 0}`);
    return;
  }

  console.log('[Kualitas] Engine Swiftspeed langsung, 4x');
  const r = await run({ scale: 4, engine: 'quality' });
  if (!r.done) {
    console.log(`   GAGAL: ${r.error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`   Engine terpakai: ${r.done.engineLabel}`);
  console.log(
    `   Output: ${r.done.output.width}x${r.done.output.height} ${r.done.output.format} ${r.done.output.bytes}B`,
  );
  console.log(`   Waktu : ${(r.done.ms / 1000).toFixed(1)}s`);
  assert(r.done.engine === 'swiftspeed', 'engine kualitas memakai Swiftspeed');
  assert(r.done.output.format === 'png', 'engine kualitas menghasilkan PNG');
  assert(r.done.output.width === 1600 && r.done.output.height === 1200, 'output tepat 4x');
  assert(r.done.fellBack === false, 'tidak perlu fallback');

  console.log(`\nSelesai. Status keluar: ${process.exitCode || 0}`);
})();
