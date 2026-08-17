import { createApp } from '../server/app.js';

/**
 * Titik masuk serverless untuk Vercel.
 * Vercel membungkus app Express ini sebagai satu function; semua rute
 * /api/* diarahkan ke sini lewat vercel.json. Tidak ada app.listen di sini.
 */
export default createApp();
