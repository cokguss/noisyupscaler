import { createApp } from './app.js';

/**
 * Entri untuk pengembangan dan self-host: buat app lalu dengarkan port.
 * Di Vercel, api/index.js yang mengekspor app sebagai serverless function
 * (tanpa listen). Logika bersama ada di server/app.js.
 */
const PORT = process.env.PORT || 8787;

createApp().listen(PORT, () => {
  console.log(`Noisy Uspcaler API berjalan di http://localhost:${PORT}`);
});
