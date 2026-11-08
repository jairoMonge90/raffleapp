import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, isMaskable = false) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);

  const cx = width / 2;
  const cy = height / 2;
  const radius = isMaskable ? width * 0.45 : width * 0.42;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient background from Indigo #4f46e5 to Pink #db2777
      const t = (x + y) / (width + height);
      let r = Math.round(79 + t * (219 - 79));
      let g = Math.round(70 + t * (39 - 70));
      let b = Math.round(229 + t * (119 - 229));
      let a = 255;

      // In center, draw a white ticket badge
      const ticketW = width * 0.52;
      const ticketH = height * 0.42;
      const tx = Math.abs(dx);
      const ty = Math.abs(dy);

      if (tx < ticketW / 2 && ty < ticketH / 2) {
        // Ticket body (white with subtle cream)
        r = 255;
        g = 255;
        b = 255;

        // Notch in ticket edges
        const notchDistLeft = Math.sqrt(Math.pow(x - (cx - ticketW / 2), 2) + Math.pow(y - cy, 2));
        const notchDistRight = Math.sqrt(Math.pow(x - (cx + ticketW / 2), 2) + Math.pow(y - cy, 2));
        if (notchDistLeft < width * 0.05 || notchDistRight < width * 0.05) {
          // Notch cut-out showing background gradient
          r = Math.round(79 + t * (219 - 79));
          g = Math.round(70 + t * (39 - 70));
          b = Math.round(229 + t * (119 - 229));
        } else {
          // Four-leaf clover on left
          const cloverCenterX = cx - width * 0.08;
          const cloverCenterY = cy;
          const distToCloverCenter = Math.sqrt(Math.pow(x - cloverCenterX, 2) + Math.pow(y - cloverCenterY, 2));

          // 4 circular leaves positioned around center
          const leafOffset = width * 0.038;
          const leafRadius = width * 0.045;
          const dTop = Math.sqrt(Math.pow(x - cloverCenterX, 2) + Math.pow(y - (cloverCenterY - leafOffset), 2));
          const dBottom = Math.sqrt(Math.pow(x - cloverCenterX, 2) + Math.pow(y - (cloverCenterY + leafOffset), 2));
          const dLeft = Math.sqrt(Math.pow(x - (cloverCenterX - leafOffset), 2) + Math.pow(y - cloverCenterY, 2));
          const dRight = Math.sqrt(Math.pow(x - (cloverCenterX + leafOffset), 2) + Math.pow(y - cloverCenterY, 2));

          if (dTop < leafRadius || dBottom < leafRadius || dLeft < leafRadius || dRight < leafRadius || distToCloverCenter < width * 0.02) {
            // Emerald green four-leaf clover
            r = 16;
            g = 185;
            b = 129;
          } else if (distToCloverCenter < width * 0.088) {
            // Light background disk
            r = 254;
            g = 243;
            b = 199;
          }
        }
      }

      // Outside round corner for standard icon
      if (!isMaskable) {
        const cornerR = width * 0.22;
        // rounded rectangle check
        const qx = Math.max(0, Math.abs(dx) - (cx - cornerR));
        const qy = Math.max(0, Math.abs(dy) - (cy - cornerR));
        const cornerDist = Math.sqrt(qx * qx + qy * qy);
        if (cornerDist > cornerR) {
          a = 0; // Transparent outside rounded corner
        }
      }

      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Encode as PNG
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk (raw scanlines prefixed with filter byte 0)
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    scanlines[y * (width * 4 + 1)] = 0; // Filter None
    buffer.copy(scanlines, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(scanlines);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32 calculation
  const crc = crc32(chunk.subarray(4, 8 + len));
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(64, 64, false));

console.log('Successfully generated all PWA icons!');
