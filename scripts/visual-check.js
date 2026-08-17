/**
 * Pemeriksaan visual dan tata letak dengan Chromium sungguhan.
 * Menangkap galat konsol, meluapnya lebar halaman, tombol yang membungkus,
 * kontras tombol, lalu menyimpan tangkapan layar.
 * Jalankan: node scripts/visual-check.js
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:8787';
const OUT = 'screenshots';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
];

fs.mkdirSync(OUT, { recursive: true });

function report(ok, message) {
  console.log(`   ${ok ? 'PASS' : 'FAIL'}  ${message}`);
  if (!ok) process.exitCode = 1;
}

const browser = await chromium.launch();

for (const theme of ['dark', 'light']) {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });
    const page = await context.newPage();

    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    await page.addInitScript((t) => {
      localStorage.setItem('noisy-theme', t);
      // Chromium memakai en-US; kunci ke Indonesia supaya asersi teks konsisten.
      localStorage.setItem('noisy-lang', 'id');
    }, theme);

    await page.goto(BASE, { waitUntil: 'load' });

    // Layar-muat menutupi viewport ~1,5 detik di awal. Tunggu sampai hilang
    // supaya tangkapan layar dan pemeriksaan tata letak tidak menangkapnya.
    await page
      .getByText('MEMUAT', { exact: true })
      .waitFor({ state: 'detached', timeout: 10_000 })
      .catch(() => console.log('   CATATAN  layar-muat belum hilang dalam 10 detik'));

    // Tunggu setiap <img> benar-benar selesai memuat, bukan hanya selesai render.
    // Tanpa ini, gambar yang masih dalam perjalanan akan lolos dari pemeriksaan.
    await page
      .waitForFunction(() => [...document.images].every((img) => img.complete), null, {
        timeout: 25_000,
      })
      .catch(() => console.log('   CATATAN  sebagian gambar belum selesai dalam 25 detik'));
    await page.waitForTimeout(1200); // beri waktu animasi masuk selesai

    const label = `${theme}-${vp.name}`;
    console.log(`\n[${label}]`);

    // 1. Tidak ada galat konsol
    report(consoleErrors.length === 0, `bebas galat konsol${consoleErrors.length ? `: ${consoleErrors[0].slice(0, 120)}` : ''}`);

    // 2. Tidak ada gulir horizontal
    const overflow = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    report(
      overflow.scrollW <= overflow.clientW + 1,
      `tanpa gulir horizontal (${overflow.scrollW} <= ${overflow.clientW})`,
    );

    // 3. Semua gambar benar-benar termuat dan punya piksel
    const imageState = await page.evaluate(() => {
      const all = [...document.images];
      return {
        total: all.length,
        broken: all.filter((img) => img.naturalWidth === 0).map((img) => img.currentSrc || img.src),
      };
    });
    report(
      imageState.total > 0 && imageState.broken.length === 0,
      `${imageState.total} gambar termuat${imageState.broken.length ? `, gagal: ${imageState.broken[0]}` : ''}`,
    );

    // 4. Tombol utama tidak membungkus ke dua baris.
    //    Kartu tautan (mis. kontak) sengaja tinggi: ikon + judul + deskripsi
    //    yang ditumpuk. Itu bukan pembungkusan, jadi lewati elemen yang memuat
    //    beberapa anak blok atau sebuah <p>.
    const wrapped = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll('a, button')) {
        const text = el.textContent.trim();
        if (!text || text.length > 40) continue;
        const elementChildren = [...el.children];
        const isComposite =
          elementChildren.length > 1 || el.querySelector('p, h1, h2, h3, h4, h5, h6');
        if (isComposite) continue;
        const style = getComputedStyle(el);
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
        const rect = el.getBoundingClientRect();
        if (rect.height === 0) continue;
        const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        const contentHeight = rect.height - padding;
        if (contentHeight > lineHeight * 1.75) out.push(`${text.slice(0, 30)} (${Math.round(rect.height)}px)`);
      }
      return out;
    });
    report(wrapped.length === 0, `tak ada tombol membungkus${wrapped.length ? `: ${wrapped.join(', ')}` : ''}`);

    // 5. Navigasi satu baris dan tidak lebih tinggi dari 80px (khusus desktop)
    if (vp.name === 'desktop') {
      const navHeight = await page.evaluate(() => {
        const nav = document.querySelector('header nav');
        return nav ? Math.round(nav.getBoundingClientRect().height) : 0;
      });
      report(navHeight > 0 && navHeight <= 80, `tinggi nav ${navHeight}px, batas 80px`);

      // 6. Hero muat dalam viewport pertama: CTA utama terlihat tanpa gulir
      const ctaTop = await page.evaluate(() => {
        const cta = [...document.querySelectorAll('a')].find((a) =>
          a.textContent.includes('Perbesar gambar'),
        );
        return cta ? Math.round(cta.getBoundingClientRect().bottom) : -1;
      });
      report(ctaTop > 0 && ctaTop <= vp.height, `CTA hero terlihat tanpa gulir (bawah pada ${ctaTop}px)`);
    }

    await page.screenshot({ path: `${OUT}/${label}-hero.png` });

    // Tangkap juga studio dan bagian engine
    await page.evaluate(() => document.querySelector('#studio')?.scrollIntoView());
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}/${label}-studio.png` });

    if (vp.name === 'desktop') {
      await page.evaluate(() => document.querySelector('#engine')?.scrollIntoView());
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${label}-engine.png` });

      await page.evaluate(() => document.querySelector('#tanya')?.scrollIntoView());
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${label}-tanya.png` });
    }

    await context.close();
  }
}

await browser.close();
console.log(`\nTangkapan layar tersimpan di ${OUT}/`);
console.log(`Status keluar: ${process.exitCode || 0}`);
