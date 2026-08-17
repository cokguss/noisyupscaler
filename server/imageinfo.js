/**
 * Pembaca dimensi gambar dari buffer, tanpa dependency native.
 * Mendukung PNG, JPEG, dan WebP (VP8 / VP8L / VP8X).
 * Dipakai untuk melaporkan resolusi input & output yang sebenarnya ke UI.
 */

function readPng(buf) {
  if (buf.length < 24) return null;
  if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), format: 'png' };
}

function readJpeg(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // SOF0..SOF15, kecuali DHT (c4), JPG (c8), DAC (cc)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7), format: 'jpeg' };
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

function readWebp(buf) {
  if (buf.length < 30) return null;
  if (buf.slice(0, 4).toString('latin1') !== 'RIFF') return null;
  if (buf.slice(8, 12).toString('latin1') !== 'WEBP') return null;
  const chunk = buf.slice(12, 16).toString('latin1');

  if (chunk === 'VP8 ') {
    return {
      width: buf.readUInt16LE(26) & 0x3fff,
      height: buf.readUInt16LE(28) & 0x3fff,
      format: 'webp',
    };
  }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
      format: 'webp',
    };
  }
  if (chunk === 'VP8X') {
    return {
      width: (buf.readUIntLE(24, 3) & 0xffffff) + 1,
      height: (buf.readUIntLE(27, 3) & 0xffffff) + 1,
      format: 'webp',
    };
  }
  return { width: null, height: null, format: 'webp' };
}

export function imageInfo(buf) {
  const parsed = readPng(buf) || readJpeg(buf) || readWebp(buf) || {
    width: null,
    height: null,
    format: 'unknown',
  };
  return { ...parsed, bytes: buf.length };
}

/** Guard tipe berkas berdasarkan magic bytes, bukan sekadar ekstensi atau mime dari klien. */
export function isSupportedImage(buf) {
  return Boolean(readPng(buf) || readJpeg(buf) || readWebp(buf));
}
