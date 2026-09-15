// Erzeugt die PWA-Icons (App-Icon + maskable-Variante) als minimalistisches Faultier-Symbol.
// Kein Bild-Tool nötig: reine Pixel-/PNG-Erzeugung über Node's zlib.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePNG(width, height, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgbaBuffer.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([signature, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

/** Zeichnet ein minimalistisches, ruhiges Faultier-Gesicht auf teal Grund. */
function renderIcon(size, { maskable = false } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const bg = hexToRgb('#0f766e'); // teal-700
  const bgLight = hexToRgb('#14b8a6'); // teal-500 (sanfter Verlauf)
  const cream = hexToRgb('#fdf6ec');
  const brown = hexToRgb('#8a6a52');
  const darkBrown = hexToRgb('#4a3527');

  const cx = size / 2;
  const cy = size / 2;
  // Bei maskable-Icons bleibt ein Sicherheitsrand (~safe zone 80%), sonst füllt die Form mehr aus.
  const contentScale = maskable ? 0.72 : 0.9;
  const faceR = size * 0.34 * contentScale * 1.1;
  const cornerR = maskable ? 0 : size * 0.22;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Hintergrund: abgerundetes Quadrat mit sanftem vertikalem Verlauf.
      let inside = true;
      if (cornerR > 0) {
        const rx = Math.min(x, size - 1 - x);
        const ry = Math.min(y, size - 1 - y);
        if (rx < cornerR && ry < cornerR) {
          const dx = cornerR - rx;
          const dy = cornerR - ry;
          inside = dx * dx + dy * dy <= cornerR * cornerR;
        }
      }
      const t = y / size;
      let r = mix(bgLight[0], bg[0], t);
      let g = mix(bgLight[1], bg[1], t);
      let b = mix(bgLight[2], bg[2], t);

      if (!inside) {
        buf[idx] = 0;
        buf[idx + 1] = 0;
        buf[idx + 2] = 0;
        buf[idx + 3] = 0;
        continue;
      }

      const dx = x - cx;
      const dy = y - cy - size * 0.02;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gesichtsfläche (creme, sanft abgesetzt)
      if (dist <= faceR) {
        r = cream[0];
        g = cream[1];
        b = cream[2];

        // Augenmaske (typisch für ein Faultier): zwei sanfte braune Flecken.
        const eyeOffsetX = faceR * 0.42;
        const eyeOffsetY = faceR * 0.08;
        const patchRX = faceR * 0.36;
        const patchRY = faceR * 0.46;
        for (const sign of [-1, 1]) {
          const ex = eyeOffsetX * sign;
          const ey = -eyeOffsetY;
          const ndx = (dx - ex) / patchRX;
          const ndy = (dy - ey) / patchRY;
          if (ndx * ndx + ndy * ndy <= 1) {
            r = brown[0];
            g = brown[1];
            b = brown[2];
          }
        }

        // Ruhige, geschlossene Augen (kleine dunkle Bögen) direkt über der Fleckenmitte.
        for (const sign of [-1, 1]) {
          const ex = eyeOffsetX * sign;
          const ey = -eyeOffsetY;
          const eyeDx = dx - ex;
          const eyeDy = dy - ey - faceR * 0.05;
          if (Math.abs(eyeDy) < faceR * 0.05 && Math.abs(eyeDx) < faceR * 0.16) {
            const arc = (eyeDx / (faceR * 0.16)) ** 2;
            if (eyeDy > -faceR * 0.05 * (1 - arc) + faceR * 0.0) {
              r = darkBrown[0];
              g = darkBrown[1];
              b = darkBrown[2];
            }
          }
        }

        // Kleine Schnauze/Nase unten mittig.
        const noseDx = dx;
        const noseDy = dy - faceR * 0.42;
        if (Math.sqrt(noseDx * noseDx * 2.2 + noseDy * noseDy) < faceR * 0.16) {
          r = mix(cream[0], brown[0], 0.5);
          g = mix(cream[1], brown[1], 0.5);
          b = mix(cream[2], brown[2], 0.5);
        }
        if (Math.sqrt(noseDx * noseDx * 3 + (noseDy - faceR * 0.02) * (noseDy - faceR * 0.02) * 6) < faceR * 0.06) {
          r = darkBrown[0];
          g = darkBrown[1];
          b = darkBrown[2];
        }
      }

      buf[idx] = Math.round(r);
      buf[idx + 1] = Math.round(g);
      buf[idx + 2] = Math.round(b);
      buf[idx + 3] = 255;
    }
  }
  return buf;
}

const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: 'pwa-192.png', size: 192, maskable: false },
  { file: 'pwa-512.png', size: 512, maskable: false },
  { file: 'pwa-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const t of targets) {
  const buf = renderIcon(t.size, { maskable: t.maskable });
  const png = encodePNG(t.size, t.size, buf);
  fs.writeFileSync(path.join(outDir, t.file), png);
  console.log('Erzeugt:', t.file);
}
