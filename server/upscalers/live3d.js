/**
 * Engine: Live3D (app-v1.live3d.io)
 * Terverifikasi 4x upscale: 400x300 -> 1600x1200 WebP dalam ~10.7s.
 * Endpoint butuh header bertanda tangan (RSA + AES), jadi wajib dijalankan
 * dari server. Tidak mungkin dipanggil langsung dari browser.
 */
import axios from 'axios';
import crypto from 'node:crypto';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';

const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`;

const APP_ID = 'aifaceswap';
const U_ID = '1H5tRtzsBkqXcaJ';
const FN_NAME = 'demo-image-upscaler';
const BRAND_KEY = '8f3f0c7387123ae0';
const THEME_VERSION = '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q';
const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function randomString(len) {
  let out = '';
  for (let i = 0; i < len; i++) out += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  return out;
}

function aesEncrypt(data, key) {
  const k = CryptoJS.enc.Utf8.parse(key);
  return CryptoJS.AES.encrypt(data, k, {
    iv: k,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();
}

function rsaEncrypt(data) {
  return crypto
    .publicEncrypt(
      { key: PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING },
      Buffer.from(data, 'utf8'),
    )
    .toString('base64');
}

function signedHeaders(type, fp = null) {
  const now = new Date();
  const utcSeconds = Math.floor(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds(),
    ) / 1000,
  );
  const uuid = crypto.randomUUID();
  const sessionKey = randomString(16);
  const fingerprint = fp || crypto.randomBytes(16).toString('hex');
  const guide = rsaEncrypt(sessionKey);
  const signPayload =
    type === 'upload'
      ? `${APP_ID}:${uuid}:${guide}`
      : `${APP_ID}:${U_ID}:${utcSeconds}:${uuid}:${guide}`;

  return {
    fp: fingerprint,
    fp1: aesEncrypt(`${APP_ID}:${fingerprint}`, sessionKey),
    'x-guide': guide,
    'x-sign': aesEncrypt(signPayload, sessionKey),
    'x-code': String(Date.now()),
  };
}

const baseHeaders = { 'User-Agent': UA, 'theme-version': THEME_VERSION };

async function uploadImage(buffer, filename) {
  const headers = signedHeaders('upload');
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: 'image/jpeg' });
  form.append('fn_name', FN_NAME);
  form.append('request_from', '9');
  form.append('origin_from', BRAND_KEY);

  const res = await axios.post('https://app-v1.live3d.io/aitools/upload-img', form, {
    timeout: 60_000,
    headers: {
      ...baseHeaders,
      origin: 'https://live3d.io',
      referer: 'https://live3d.io/',
      ...headers,
      ...form.getHeaders(),
    },
  });

  const path = res.data?.data?.path;
  if (!path) throw new Error(`Upload ditolak engine: ${JSON.stringify(res.data).slice(0, 200)}`);
  return { path, fp: headers.fp };
}

async function createTask(remotePath, scale, fp) {
  const res = await axios.post(
    'https://app-v1.live3d.io/aitools/of/create',
    {
      fn_name: FN_NAME,
      call_type: 3,
      input: { source_image: remotePath, scale, request_from: 9 },
      request_from: 9,
      origin_from: BRAND_KEY,
    },
    { timeout: 60_000, headers: { ...baseHeaders, ...signedHeaders('create', fp) } },
  );

  const taskId = res.data?.data?.task_id;
  if (!taskId) throw new Error(`Task gagal dibuat: ${JSON.stringify(res.data).slice(0, 200)}`);
  return taskId;
}

async function checkTask(taskId, fp) {
  const res = await axios.post(
    'https://app-v1.live3d.io/aitools/of/check-status',
    {
      task_id: taskId,
      fn_name: FN_NAME,
      call_type: 3,
      request_from: 9,
      origin_from: BRAND_KEY,
    },
    { timeout: 60_000, headers: { ...baseHeaders, ...signedHeaders('check', fp) } },
  );
  return res.data?.data ?? {};
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {Buffer} buffer gambar sumber
 * @param {number} scale 2 atau 4
 * @param {(pct:number, code:string)=>void} onProgress kode tahap, diterjemahkan di frontend
 * @param {number} deadline stempel waktu absolut (Date.now()) batas polling.
 *   Dikirim oleh orkestrator agar total rantai fast->quality tetap di bawah
 *   batas durasi fungsi Vercel. Foto beresolusi besar (mis. 4000x3000 dari
 *   kamera ponsel) butuh ~90 dtk — jauh di atas batas lama ~60 dtk, itulah
 *   sebab galat "semua engine gagal" pada sebagian foto.
 * @returns {Promise<{url:string, engine:string}>}
 */
export async function upscaleLive3d(buffer, scale, onProgress = () => {}, deadline = Date.now() + 120_000) {
  onProgress(12, 'sending');
  const { path, fp } = await uploadImage(buffer, 'input.jpg');

  onProgress(26, 'queue');
  const taskId = await createTask(path, scale, fp);

  // Polling berbasis JAM DINDING, bukan hitungan percobaan: tiap poll membayar
  // latensi jaringan yang berubah-ubah, jadi "N percobaan" tak pernah setara
  // dengan durasi nyata. Deadline absolut membuat batasnya dapat diprediksi.
  const pollStart = Date.now();
  const EXPECT_MS = 90_000; // perkiraan durasi untuk mengisi progress bar mulus
  for (let attempt = 0; Date.now() < deadline; attempt++) {
    await sleep(attempt === 0 ? 2500 : 3000);
    if (Date.now() >= deadline) break;

    const data = await checkTask(taskId, fp);

    // status: 1 = berjalan, 2 = selesai, 3 = gagal
    if (data.status === 2 && data.result_image) {
      onProgress(88, 'fetching');
      return { url: `https://temp.live3d.io/${data.result_image}`, engine: 'live3d' };
    }
    if (data.status === 3) throw new Error('Engine melaporkan proses gagal');

    const pct = 30 + Math.round(Math.min((Date.now() - pollStart) / EXPECT_MS, 1) * 55);
    onProgress(Math.min(pct, 85), 'reconstruct');
  }

  throw new Error('Waktu tunggu engine habis');
}
