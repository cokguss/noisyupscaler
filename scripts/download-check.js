/**
 * Membuktikan tombol "Unduh hasil" benar-benar menyimpan berkas — termasuk
 * jalur mobile yang sebelumnya bug (data URL + download diabaikan iOS).
 *
 * Dua konteks:
 *   A. Mobile (share tersedia)  -> navigator.share dipanggil dengan File
 *   B. Desktop (share absen)    -> unduhan blob (event 'download' Playwright)
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:8787';
const browser = await chromium.launch();

function report(ok, msg) {
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) process.exitCode = 1;
}

async function runUpscale(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('noisy-lang', 'id');
    } catch {
      /* abaikan */
    }
  });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.getByText('MEMUAT', { exact: true }).waitFor({ state: 'detached', timeout: 10_000 }).catch(() => {});
  await page.locator('button[data-sample-id="kota"]').click();
  const btn = page.getByRole('button', { name: /Perbesar 4x/i });
  await btn.waitFor({ state: 'visible', timeout: 10_000 });
  await btn.click();
  // Tunggu hasil (slider muncul saat hasil diterima)
  await page.locator('[role="slider"]').waitFor({ state: 'visible', timeout: 150_000 });
}

// ---------- A. Jalur MOBILE: Web Share API ----------
{
  console.log('[A] Mobile — Web Share API');
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();

  // Pasang stub SEBELUM skrip app jalan: rekam file yang dibagikan.
  await page.addInitScript(() => {
    window.__shared = null;
    navigator.canShare = (data) => Boolean(data?.files?.length);
    navigator.share = async (data) => {
      const f = data.files[0];
      window.__shared = { name: f.name, type: f.type, size: f.size };
    };
  });

  await runUpscale(page);
  await page.getByRole('link', { name: /Unduh hasil/i }).click();
  await page.waitForTimeout(400);

  const shared = await page.evaluate(() => window.__shared);
  report(Boolean(shared), 'navigator.share dipanggil saat unduh di mobile');
  report(shared?.size > 0, `berkas dibagikan punya isi (${shared?.size ?? 0} byte)`);
  report(
    /image\/(webp|png|jpeg)/.test(shared?.type || ''),
    `tipe berkas gambar valid (${shared?.type})`,
  );
  report(/-noisy-4x\./.test(shared?.name || ''), `nama berkas benar (${shared?.name})`);
  await ctx.close();
}

// ---------- B. Jalur DESKTOP: unduhan blob ----------
{
  console.log('\n[B] Desktop — unduhan blob');
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // Pastikan Web Share tidak ada, jadi jatuh ke jalur unduhan blob.
  await page.addInitScript(() => {
    delete navigator.share;
    navigator.canShare = undefined;
  });

  await runUpscale(page);

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 10_000 }),
    page.getByRole('link', { name: /Unduh hasil/i }).click(),
  ]);
  const suggested = download.suggestedFilename();
  report(Boolean(suggested), `unduhan terpicu (nama disarankan: ${suggested})`);
  report(/-noisy-4x\./.test(suggested), 'nama berkas unduhan benar');
  await ctx.close();
}

await browser.close();
console.log(`\nStatus keluar: ${process.exitCode || 0}`);
