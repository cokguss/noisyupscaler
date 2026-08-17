/* Test harness: coba 3 API upscaler, laporkan mana yang bagus */
const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const CryptoJS = require('crypto-js');

const TEST_IMAGE = 'https://picsum.photos/id/237/400/300'; // ~small image
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- API 1: Swiftspeed ----------
async function testSwiftspeed(imageUrl, scale = 4) {
  const base = 'https://swiftspeed.app/api/v2/tools/upscale';
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'Origin': 'https://swiftspeed.app',
    'Referer': 'https://swiftspeed.app/tools/image-upscaler',
  };
  const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const buf = Buffer.from(img.data, 'binary');
  const form = new FormData();
  form.append('file', buf, { filename: 'target.jpg' });
  form.append('scale', String(scale));
  const res = await axios.post(base, form, { headers: { ...headers, ...form.getHeaders() } });
  const jobId = res.data?.job_id;
  if (!jobId) throw new Error('no job_id: ' + JSON.stringify(res.data));
  for (let i = 0; i < 30; i++) {
    const st = await axios.get(`${base}/status/${jobId}`, { headers });
    if (st.data.status === 'done') {
      const r = st.data.results?.[0];
      const url = r.download_url.startsWith('http') ? r.download_url : `https://swiftspeed.app${r.download_url}`;
      return { download_url: url, engine: r.engine };
    }
    await sleep(2000);
  }
  throw new Error('timeout');
}

// ---------- API 2: imgupscaler ----------
function randomIP() {
  const r = () => Math.floor(Math.random() * 254) + 1;
  return `${r()}.${r()}.${r()}.${r()}`;
}
async function testImgupscaler(imageUrl, scale = '4') {
  const ip = randomIP();
  const headers = {
    'Origin': 'https://imgupscaler.com',
    'Referer': 'https://imgupscaler.com/',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
    'X-Client-Ipv4': ip,
    'X-Forwarded-For': ip,
  };
  const stream = await axios({ method: 'GET', url: imageUrl, responseType: 'stream' });
  const form = new FormData();
  form.append('tool', 'upscaler');
  form.append('mode', 'batch');
  form.append('scaleRadio', scale);
  form.append('file', stream.data, { filename: 'image.jpg', contentType: stream.headers['content-type'] || 'image/jpeg' });
  const up = await axios.post('https://imgupscaler.com/api/legacy/upload', form, { headers: { ...form.getHeaders(), ...headers } });
  const taskId = up.data?.taskId;
  if (!taskId) throw new Error('no taskId: ' + JSON.stringify(up.data));
  for (let i = 0; i < 50; i++) {
    await sleep(2000);
    const st = await axios.post('https://imgupscaler.com/api/legacy/status', { tool: 'upscaler', taskId, scaleRadio: scale }, { headers: { 'Content-Type': 'application/json', ...headers } });
    const d = st.data;
    if (d.status === 'success' && d.downloadUrls?.length) return { download_url: d.downloadUrls[0] };
    if (d.status !== 'waiting') throw new Error('failed: ' + JSON.stringify(d));
  }
  throw new Error('timeout');
}

// ---------- API 3: Live3d ----------
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCwlO+boC6cwRo3UfXVBadaYwcX
0zKS2fuVNY2qZ0dgwb1NJ+/Q9FeAosL4ONiosD71on3PVYqRUlL5045mvH2K9i8b
AFVMEip7E6RMK6tKAAif7xzZrXnP1GZ5Rijtqdgwh+YmzTo39cuBCsZqK9oEoeQ3
r/myG9S+9cR5huTuFQIDAQAB
-----END PUBLIC KEY-----`;
const APP_ID = 'aifaceswap', U_ID = '1H5tRtzsBkqXcaJ', FN_NAME = 'demo-image-upscaler', BRAND_KEY = '8f3f0c7387123ae0';
function randStr(len) { const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; let s = ''; for (let i = 0; i < len; i++) s += c.charAt(Math.floor(Math.random() * c.length)); return s; }
function aesenc(data, key) { const k = CryptoJS.enc.Utf8.parse(key); return CryptoJS.AES.encrypt(data, k, { iv: k, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }).toString(); }
function rsaenc(data) { return crypto.publicEncrypt({ key: PUBLIC_KEY, padding: crypto.constants.RSA_PKCS1_PADDING }, Buffer.from(data, 'utf8')).toString('base64'); }
function genHeaders(type, fp = null) {
  const e = new Date();
  const n = Math.floor(new Date(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate(), e.getUTCHours(), e.getUTCMinutes(), e.getUTCSeconds()).getTime() / 1000);
  const r = crypto.randomUUID(), i = randStr(16), fingerPrint = fp || crypto.randomBytes(16).toString('hex'), s = rsaenc(i);
  const signStr = (type === 'upload') ? `${APP_ID}:${r}:${s}` : `${APP_ID}:${U_ID}:${n}:${r}:${s}`;
  return { fp: fingerPrint, fp1: aesenc(`${APP_ID}:${fingerPrint}`, i), 'x-guide': s, 'x-sign': aesenc(signStr, i), 'x-code': Date.now().toString() };
}
async function testLive3d(imageUrl, scale = 4) {
  const ch = genHeaders('upload');
  const img = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const form = new FormData();
  form.append('file', Buffer.from(img.data), { filename: 'input.jpg', contentType: 'image/jpeg' });
  form.append('fn_name', FN_NAME); form.append('request_from', '9'); form.append('origin_from', BRAND_KEY);
  const upRes = await axios.post('https://app-v1.live3d.io/aitools/upload-img', form, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'origin': 'https://live3d.io', 'referer': 'https://live3d.io/', 'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q', ...ch, ...form.getHeaders() },
  });
  const path = upRes.data.data.path, fp = ch.fp;
  const ch2 = genHeaders('create', fp);
  const payload = { fn_name: FN_NAME, call_type: 3, input: { source_image: path, scale, request_from: 9 }, request_from: 9, origin_from: BRAND_KEY };
  const cr = await axios.post('https://app-v1.live3d.io/aitools/of/create', payload, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q', ...ch2 } });
  const taskId = cr.data.data.task_id;
  for (let i = 0; i < 15; i++) {
    await sleep(4000);
    const ch3 = genHeaders('check', fp);
    const p2 = { task_id: taskId, fn_name: FN_NAME, call_type: 3, request_from: 9, origin_from: BRAND_KEY };
    const st = await axios.post('https://app-v1.live3d.io/aitools/of/check-status', p2, { headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36', 'theme-version': '83EmcUoQTUv50LhNx0VrdcK8rcGexcP35FcZDcpgWsAXEyO4xqL5shCY6sFIWB2Q', ...ch3 } });
    const d = st.data.data;
    if (d.status === 2) return { download_url: 'https://temp.live3d.io/' + d.result_image };
    if (d.status === 3) throw new Error('failed on live3d side');
  }
  throw new Error('timeout');
}

async function run(name, fn) {
  const start = Date.now();
  try {
    const r = await fn(TEST_IMAGE, 4);
    console.log(`\n✅ [${name}] OK in ${Date.now() - start}ms`);
    console.log(`   URL: ${r.download_url}`);
    return { name, ok: true, ms: Date.now() - start, ...r };
  } catch (e) {
    console.log(`\n❌ [${name}] FAIL in ${Date.now() - start}ms -> ${e.message}`);
    return { name, ok: false, ms: Date.now() - start, error: e.message };
  }
}

(async () => {
  console.log('Testing 3 upscaler APIs with:', TEST_IMAGE);
  const results = await Promise.all([
    run('Swiftspeed', testSwiftspeed),
    run('Imgupscaler', testImgupscaler),
    run('Live3d', testLive3d),
  ]);
  console.log('\n===== SUMMARY =====');
  results.filter(r => r.ok).sort((a, b) => a.ms - b.ms).forEach(r => console.log(`  ${r.name}: ${r.ms}ms -> ${r.download_url}`));
  results.filter(r => !r.ok).forEach(r => console.log(`  ${r.name}: FAILED (${r.error})`));
})();
