/**
 * Engine: Swiftspeed (swiftspeed.app)
 * Terverifikasi 4x upscale: 400x300 -> 1600x1200 PNG lossless dalam ~32.9s.
 * Lebih lambat dan berkas jauh lebih besar dari Live3D, tapi tanpa kompresi lossy,
 * jadi dipakai sebagai mode kualitas maksimal sekaligus fallback.
 */
import axios from 'axios';
import FormData from 'form-data';

const BASE_URL = 'https://swiftspeed.app/api/v2/tools/upscale';

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  Origin: 'https://swiftspeed.app',
  Referer: 'https://swiftspeed.app/tools/image-upscaler',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function createJob(buffer, scale) {
  const form = new FormData();
  form.append('file', buffer, { filename: 'upscale_target.jpg' });
  form.append('scale', String(scale));

  const res = await axios.post(BASE_URL, form, {
    timeout: 90_000,
    headers: { ...headers, ...form.getHeaders() },
  });

  const jobId = res.data?.job_id;
  if (!jobId) throw new Error(`Job gagal dibuat: ${JSON.stringify(res.data).slice(0, 200)}`);
  return jobId;
}

/**
 * @param {Buffer} buffer gambar sumber
 * @param {number} scale 2 atau 4
 * @param {(pct:number, code:string)=>void} onProgress kode tahap, diterjemahkan di frontend
 * @param {number} deadline stempel waktu absolut (Date.now()) batas polling,
 *   dikirim orkestrator agar total rantai fallback tetap di bawah batas Vercel.
 * @returns {Promise<{url:string, engine:string}>}
 */
export async function upscaleSwiftspeed(buffer, scale, onProgress = () => {}, deadline = Date.now() + 150_000) {
  onProgress(12, 'sending');
  const jobId = await createJob(buffer, scale);

  onProgress(26, 'queue');

  // Berbasis jam dinding, bukan hitungan percobaan (lihat catatan di live3d.js):
  // latensi tiap poll berubah-ubah, jadi deadline absolut jauh lebih andal.
  const pollStart = Date.now();
  const EXPECT_MS = 110_000; // Swiftspeed lebih lambat; perkiraan untuk progress bar

  for (let attempt = 0; Date.now() < deadline; attempt++) {
    await sleep(2500);
    if (Date.now() >= deadline) break;

    let data;
    try {
      const res = await axios.get(`${BASE_URL}/status/${jobId}`, { timeout: 30_000, headers });
      data = res.data;
    } catch {
      continue; // status endpoint sesekali meleset, lanjut polling
    }

    if (data?.status === 'done') {
      const result = data.results?.[0];
      if (result?.download_url) {
        const url = result.download_url.startsWith('http')
          ? result.download_url
          : `https://swiftspeed.app${result.download_url}`;
        onProgress(88, 'fetching');
        return { url, engine: 'swiftspeed' };
      }
    }
    if (data?.status === 'failed' || data?.status === 'error') {
      throw new Error('Engine melaporkan proses gagal');
    }

    const pct = 30 + Math.round(Math.min((Date.now() - pollStart) / EXPECT_MS, 1) * 55);
    onProgress(Math.min(pct, 85), 'reconstruct');
  }

  throw new Error('Waktu tunggu engine habis');
}
