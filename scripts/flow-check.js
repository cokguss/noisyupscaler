/**
 * Uji alur pengguna sungguhan di Chromium: pilih gambar contoh, tekan tombol
 * proses, tunggu hasil, lalu periksa slider pembanding dan tautan unduhan.
 * Ini yang membuktikan frontend dan backend benar-benar tersambung.
 * Jalankan: node scripts/flow-check.js
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:8787';
const OUT = 'screenshots';
fs.mkdirSync(OUT, { recursive: true });

function report(ok, message) {
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${message}`);
  if (!ok) process.exitCode = 1;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('pageerror', (err) => errors.push(err.message));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

// Chromium melaporkan navigator.language = en-US, jadi tanpa ini UI akan
// tampil dalam bahasa Inggris dan semua asersi teks Indonesia gagal.
await page.addInitScript(() => {
  try {
    localStorage.setItem('noisy-lang', 'id');
  } catch {
    /* abaikan */
  }
});

console.log('[Alur] Buka halaman');
await page.goto(BASE, { waitUntil: 'load' });

// Layar-muat menutupi seluruh viewport di awal; tunggu sampai hilang
// supaya klik tidak terhalang dan tangkapan layar bersih.
await page
  .getByText('MEMUAT', { exact: true })
  .waitFor({ state: 'detached', timeout: 10_000 })
  .catch(() => {});

console.log('[Alur] Pilih gambar contoh pertama');
await page.locator('button[data-sample-id="kota"]').click();

// Pratinjau harus muncul dan tombol proses aktif
const upscaleButton = page.getByRole('button', { name: /Perbesar 4x/i });
await upscaleButton.waitFor({ state: 'visible', timeout: 10_000 });
report(await upscaleButton.isEnabled(), 'tombol proses aktif setelah gambar dipilih');
await page.screenshot({ path: `${OUT}/flow-1-terpilih.png` });

console.log('[Alur] Jalankan proses (menunggu engine, bisa sampai 90 detik)');
await upscaleButton.click();

// Bilah progres harus muncul, membuktikan stream progres sampai ke UI
const progressBar = page.locator('[role="progressbar"]');
await progressBar.waitFor({ state: 'visible', timeout: 15_000 });
report(true, 'bilah progres muncul selama proses');
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/flow-2-proses.png` });

// Tunggu hasil: slider pembanding muncul
const slider = page.locator('[role="slider"]');
await slider.waitFor({ state: 'visible', timeout: 150_000 });
report(true, 'slider pembanding muncul, artinya hasil diterima');

// Statistik hasil harus berisi resolusi nyata
const stats = await page.locator('dl').first().innerText();
console.log(`   Statistik:\n${stats.split('\n').map((l) => `      ${l}`).join('\n')}`);
report(/1680 x 1260|\d{3,} x \d{3,}/.test(stats), 'resolusi hasil ditampilkan sebagai angka nyata');

// Gambar hasil harus punya piksel sungguhan. Hasil kini dikirim sebagai
// data URL (base64) di dalam stream, bukan lewat endpoint /api/result/.
const resultLoaded = await page.evaluate(() => {
  const img = [...document.images].find((i) => i.src.startsWith('data:image/'));
  return img ? { ok: img.naturalWidth > 0, w: img.naturalWidth, h: img.naturalHeight } : null;
});
report(Boolean(resultLoaded?.ok), `gambar hasil termuat (${resultLoaded?.w}x${resultLoaded?.h})`);

// Tautan unduhan harus tersedia
const download = page.getByRole('link', { name: /Unduh hasil/i });
report(await download.isVisible(), 'tautan unduh hasil tersedia');
const href = await download.getAttribute('href');
const downloadAttr = await download.getAttribute('download');
report(
  (href || '').startsWith('data:image/') && Boolean(downloadAttr),
  `tautan unduh benar (download="${downloadAttr}", data URL ${(href || '').slice(0, 22)}...)`,
);

await page.screenshot({ path: `${OUT}/flow-3-hasil.png` });

console.log('[Alur] Uji geser slider pembanding dengan keyboard');
await slider.focus();
const before = await slider.getAttribute('aria-valuenow');
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('ArrowLeft');
const after = await slider.getAttribute('aria-valuenow');
report(before !== after, `slider bergerak dengan panah (${before} lalu ${after})`);

console.log('[Alur] Uji tombol perbesar pratinjau');
await page.getByRole('button', { name: /Perbesar 1x/i }).click();
await page.waitForTimeout(500);
report(
  await page.getByRole('button', { name: /Perbesar 2x/i }).isVisible(),
  'tombol perbesar berputar ke tingkat berikutnya',
);
await page.screenshot({ path: `${OUT}/flow-4-zoom.png` });

report(errors.length === 0, `bebas galat konsol${errors.length ? `: ${errors[0].slice(0, 140)}` : ''}`);

await browser.close();
console.log(`\nStatus keluar: ${process.exitCode || 0}`);
