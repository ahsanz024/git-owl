const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const crcTable = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crcInput = Buffer.concat([t, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, t, data, crcBuf]);
}

function createPNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 6; // RGBA
  ihdr[9] = 8; // bit depth

  const compressed = zlib.deflateSync(pixels);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function isPRIcon(x, y, s) {
  const leftCircle1 = { cx: 42 * s, cy: 35 * s, r: 10 * s };
  const leftCircle2 = { cx: 42 * s, cy: 93 * s, r: 10 * s };
  const rightCircle = { cx: 96 * s, cy: 64 * s, r: 22 * s };

  for (const c of [leftCircle1, leftCircle2, rightCircle]) {
    const dx = x - c.cx, dy = y - c.cy;
    if (dx * dx + dy * dy <= c.r * c.r) return true;
  }

  const lineWidth = 7 * s;

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  if (distToSegment(x, y, 52 * s, 45 * s, 74 * s, 55 * s) <= lineWidth) return true;
  if (distToSegment(x, y, 52 * s, 83 * s, 74 * s, 73 * s) <= lineWidth) return true;

  return false;
}

function generateIcon(size) {
  const s = size / 128;
  const cx = size / 2, cy = size / 2;
  const bgRadius = size / 2 - 2;
  const rowSize = 1 + size * 4;
  const pixels = Buffer.alloc(size * rowSize);

  for (let y = 0; y < size; y++) {
    pixels[y * rowSize] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const offset = y * rowSize + 1 + x * 4;

      if (dist <= bgRadius) {
        const isWhite = isPRIcon(x, y, s);
        if (isWhite) {
          pixels[offset] = 255;
          pixels[offset + 1] = 255;
          pixels[offset + 2] = 255;
          pixels[offset + 3] = 255;
        } else {
          pixels[offset] = 64;
          pixels[offset + 1] = 120;
          pixels[offset + 2] = 192;
          pixels[offset + 3] = 255;
        }
      } else {
        pixels[offset + 3] = 0;
      }
    }
  }

  return createPNG(size, size, pixels);
}

const outDir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(outDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const png = generateIcon(size);
  const outPath = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created ${outPath} (${png.length} bytes)`);
}

console.log('Done!');
