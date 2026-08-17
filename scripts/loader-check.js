/**
 * Verifikasi perilaku layar-muat berbasis sessionStorage:
 *  1. Kunjungan pertama (konteks bersih)  -> loader MUNCUL
 *  2. Refresh di tab yang sama            -> loader TIDAK muncul
 *  3. Tab/konteks baru                    -> loader MUNCUL lagi
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8787';
const browser = await chromium.launch();

function report(ok, msg) {
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) process.exitCode = 1;
}

// Loader ditandai oleh label MEMUAT (bhs Indonesia). Cek kehadirannya
// sesaat setelah load, sebelum sempat memudar.
async function loaderAppeared(page) {
  await page.addInitScript(() => localStorage.setItem('noisy-lang', 'id'));
  await page.goto(BASE, { waitUntil: 'commit' });
  try {
    await page.getByText('MEMUAT', { exact: true }).waitFor({ state: 'visible', timeout: 2500 });
    return true;
  } catch {
    return false;
  }
}

// --- Konteks A: tab pertama ---
const ctxA = await browser.newContext();
const pageA = await ctxA.newPage();

const first = await loaderAppeared(pageA);
report(first, 'kunjungan pertama: loader muncul');

// tunggu loader benar-benar hilang agar sessionStorage sudah tertandai
await pageA.getByText('MEMUAT', { exact: true }).waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});

// refresh #1 dan #2 di tab yang sama
await pageA.reload({ waitUntil: 'commit' });
const refresh1 = await pageA.getByText('MEMUAT', { exact: true }).isVisible().catch(() => false);
report(!refresh1, 'refresh pertama (tab sama): loader TIDAK muncul');

await pageA.reload({ waitUntil: 'commit' });
const refresh2 = await pageA.getByText('MEMUAT', { exact: true }).isVisible().catch(() => false);
report(!refresh2, 'refresh kedua (tab sama): loader TIDAK muncul');

await ctxA.close();

// --- Konteks B: tab/browser baru (sessionStorage bersih) ---
const ctxB = await browser.newContext();
const pageB = await ctxB.newPage();
const newTab = await loaderAppeared(pageB);
report(newTab, 'tab/browser baru: loader muncul lagi');
await ctxB.close();

await browser.close();
console.log(`\nStatus keluar: ${process.exitCode || 0}`);
