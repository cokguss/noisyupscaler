/**
 * Uji ALIR NYATA lewat UI yang sudah di-build, penjaga regresi untuk galat
 * "semua engine gagal / kehabisan waktu" pada FOTO BESAR di 4x.
 *
 * Foto beresolusi tinggi di 4x menghasilkan puluhan megapiksel yang tak selesai
 * dalam batas 300 dtk fungsi Vercel. Perbaikannya: klien memperkecil input lebih
 * dulu agar output <= ~32 MP (lihat prepareUpload di src/lib/api.js). Uji ini
 * membuktikan jalur itu utuh dari UI: unggah -> perkecil -> unggah -> stream ->
 * hasil + catatan "diperkecil otomatis", dan bahwa engine MENERIMA JPEG kecil.
 *
 * Mandiri: gambar uji besar diambil dari picsum, jadi bisa dijalankan siapa pun.
 * Butuh server lokal menyajikan dist/ (npm run build && node server/index.js).
 *
 * Jalankan: node scripts/ui-e2e.mjs
 */
import { chromium } from 'playwright';

const APP = process.env.APP_URL || 'http://localhost:8787';
const MAX_OUTPUT_PIXELS = 32_000_000; // wajib sinkron dengan src/lib/api.js

// ~9,7 MP: di 4x itu ~155 MP -> jauh di atas plafon, jadi PASTI diperkecil.
const buffer = Buffer.from(
  await (await fetch('https://picsum.photos/3600/2700.jpg', { redirect: 'follow' })).arrayBuffer(),
);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(APP, { waitUntil: 'domcontentloaded' });

await page.setInputFiles('#studio input[type=file]', {
  name: 'foto-besar.jpg',
  mimeType: 'image/jpeg',
  buffer,
});

// Pastikan 4x terpilih (default sudah 4x, tapi klik eksplisit agar deterministik).
await page.getByRole('button', { name: /^4x$/ }).click();

// Tekan tombol utama "Perbesar 4x" / "Upscale 4x" (app dwibahasa ID/EN).
const t0 = Date.now();
await page.getByRole('button', { name: /(Perbesar|Upscale)\s*4x/i }).click();

// Tunggu hasil (statistik resolusi hasil) atau galat. Foto besar butuh lama.
const outcome = await Promise.race([
  page
    .getByText(/Resolusi hasil|Output resolution/i)
    .waitFor({ timeout: 280_000 })
    .then(() => 'done'),
  page.locator('.text-danger').first().waitFor({ timeout: 280_000 }).then(() => 'error'),
]);
const secs = ((Date.now() - t0) / 1000).toFixed(1);

const report = { outcome, secs };
const fail = [];

if (outcome === 'done') {
  const stats = await page.locator('dl dd').allInnerTexts();
  report.stats = stats.slice(0, 4); // hanya 4 statistik hasil, sisanya konten statis
  report.optimizedNote =
    (await page.getByText(/diperkecil ke|resized to/i).first().textContent().catch(() => null))?.trim() ||
    null;

  // Verifikasi: output benar-benar <= plafon (+ toleransi pembulatan kecil).
  const m = report.stats[1]?.match(/(\d+)\s*x\s*(\d+)/);
  if (m) {
    const outPixels = Number(m[1]) * Number(m[2]);
    report.outMegapixels = (outPixels / 1e6).toFixed(1);
    if (outPixels > MAX_OUTPUT_PIXELS * 1.02) fail.push(`output ${report.outMegapixels}MP > plafon`);
  } else {
    fail.push('tak bisa membaca dimensi hasil');
  }
  if (!report.optimizedNote) fail.push('catatan "diperkecil otomatis" tidak muncul');
} else {
  report.errorText = await page.locator('.text-danger').first().textContent();
  fail.push('proses galat');
}

console.log(JSON.stringify(report, null, 2));
if (fail.length) console.error('GAGAL:', fail.join('; '));
await browser.close();
process.exit(fail.length ? 1 : 0);
