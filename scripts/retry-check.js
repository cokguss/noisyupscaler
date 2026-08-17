/**
 * Membuktikan pemulihan otomatis saat koneksi putus di tengah proses —
 * persis galat "the connection dropped before the result finished" di mobile.
 *
 * Panggilan /api/upscale PERTAMA sengaja dibalas stream terpotong (ada baris
 * progress, tanpa baris 'done') supaya klien melempar 'disconnected'.
 * Panggilan KEDUA diteruskan ke server sungguhan; hasil harus tetap tiba.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8787';
const browser = await chromium.launch();

function report(ok, msg) {
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) process.exitCode = 1;
}

const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

await page.addInitScript(() => {
  try {
    localStorage.setItem('noisy-lang', 'id');
  } catch {
    /* abaikan */
  }
});

// Intersepsi hanya percobaan pertama; sisanya diteruskan ke server nyata.
let attempts = 0;
await page.route('**/api/upscale', async (route) => {
  attempts += 1;
  if (attempts === 1) {
    // Stream terpotong: progres lalu berhenti tanpa 'done' -> 'disconnected'.
    const body =
      JSON.stringify({ type: 'progress', pct: 8, code: 'received' }) +
      '\n' +
      JSON.stringify({ type: 'progress', pct: 40, code: 'reconstruct' }) +
      '\n';
    await route.fulfill({
      status: 200,
      headers: { 'content-type': 'application/x-ndjson; charset=utf-8' },
      body,
    });
    return;
  }
  await route.continue();
});

await page.goto(BASE, { waitUntil: 'load' });
await page.getByText('MEMUAT', { exact: true }).waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});

await page.locator('button[data-sample-id="kota"]').click();
const btn = page.getByRole('button', { name: /Perbesar 4x/i });
await btn.waitFor({ state: 'visible', timeout: 10_000 });
await btn.click();

// Meski percobaan pertama putus, hasil harus tetap muncul lewat retry otomatis.
const slider = page.locator('[role="slider"]');
await slider.waitFor({ state: 'visible', timeout: 150_000 }).catch(() => {});

report(attempts >= 2, `klien mencoba ulang setelah putus (jumlah percobaan: ${attempts})`);
report(await slider.isVisible(), 'hasil tetap muncul setelah pemulihan otomatis');

// Tidak boleh ada galat "disconnected" yang bocor ke UI.
const errorVisible = await page
  .getByText(/Koneksi terputus sebelum hasil selesai/i)
  .isVisible()
  .catch(() => false);
report(!errorVisible, 'galat koneksi tidak ditampilkan ke pengguna setelah pulih');

await browser.close();
console.log(`\nStatus keluar: ${process.exitCode || 0}`);
