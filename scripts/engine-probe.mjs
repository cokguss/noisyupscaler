/**
 * Probe langsung ke engine sungguhan pada beberapa UKURAN gambar untuk
 * memastikan foto beresolusi besar selesai dalam batas waktu polling —
 * penjaga regresi untuk galat "semua engine gagal" pada foto besar
 * (mis. 4000x3000 dari kamera ponsel) yang dulu kehabisan waktu di ~60 dtk.
 *
 * Mandiri: gambar uji diambil dari picsum, jadi bisa dijalankan siapa saja.
 * Jalankan: node scripts/engine-probe.mjs
 */
import { imageInfo } from '../server/imageinfo.js';
import { upscaleLive3d } from '../server/upscalers/live3d.js';
import { upscaleSwiftspeed } from '../server/upscalers/swiftspeed.js';

// Deadline sengaja longgar di sini (uji engine langsung, bukan lewat Vercel):
// yang diuji adalah "apakah engine SELESAI bila diberi waktu", bukan plafon.
const DEADLINE_MS = 240_000;

const SIZES = [
  { label: 'kecil', w: 420, h: 315 },
  { label: 'sedang', w: 1600, h: 1200 },
  { label: 'besar', w: 4000, h: 3000 }, // kasus regresi utama: foto ~12MP
];

async function fetchImage(w, h) {
  const res = await fetch(`https://picsum.photos/${w}/${h}.jpg`, { redirect: 'follow' });
  if (!res.ok) throw new Error(`picsum ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

for (const { label, w, h } of SIZES) {
  let buf;
  try {
    buf = await fetchImage(w, h);
  } catch (e) {
    console.log(`\n== ${label} (${w}x${h}) == gagal ambil gambar: ${e.message}, lewati`);
    continue;
  }
  const info = imageInfo(buf);
  console.log(`\n== ${label} == ${info.width}x${info.height} ${info.format} ${Math.round(buf.length / 1024)}KB`);

  // Fast (Live3D) 2x — persis kondisi yang dilaporkan pengguna.
  const tFast = Date.now();
  try {
    const r = await upscaleLive3d(buf, 2, () => {}, Date.now() + DEADLINE_MS);
    console.log(`   Live3D 2x   OK  (${((Date.now() - tFast) / 1000).toFixed(1)}s) ${r.url.slice(0, 48)}`);
  } catch (e) {
    console.log(`   Live3D 2x   GAGAL (${((Date.now() - tFast) / 1000).toFixed(1)}s): ${e.message}`);
  }

  // Quality (Swiftspeed) 2x — jalur fallback.
  const tQ = Date.now();
  try {
    const r = await upscaleSwiftspeed(buf, 2, () => {}, Date.now() + DEADLINE_MS);
    console.log(`   Swift  2x   OK  (${((Date.now() - tQ) / 1000).toFixed(1)}s) ${r.url.slice(0, 48)}`);
  } catch (e) {
    console.log(`   Swift  2x   GAGAL (${((Date.now() - tQ) / 1000).toFixed(1)}s): ${e.message}`);
  }
}
console.log('\nselesai');
