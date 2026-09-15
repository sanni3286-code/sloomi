// Erzeugt alle PWA/Homescreen-Icon-Größen aus dem neuen sloomi-Icon-Artwork.
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const src = path.join(__dirname, '..', 'public', 'icon-source.png');
const outDir = path.join(__dirname, '..', 'public');
const CREAM = { r: 251, g: 243, b: 222, alpha: 1 }; // passend zum Icon-eigenen Rahmenton

async function run() {
  // Standard-Icons (transparent, für Browser/Android normale Verwendung)
  for (const size of [192, 512]) {
    const buf = await sharp(src).resize(size, size).png({ compressionLevel: 9, palette: true, quality: 90 }).toBuffer();
    fs.writeFileSync(path.join(outDir, `pwa-${size}.png`), buf);
    console.log(`pwa-${size}.png erzeugt (${(buf.length / 1024).toFixed(0)} KB)`);
  }

  // Maskable Icon: Motiv auf ~72% verkleinert, Hintergrund deckend bis zum Rand (Android-Safe-Zone)
  const maskableCanvas = 512;
  const motif = Math.round(maskableCanvas * 0.72);
  const motifBuf = await sharp(src).resize(motif, motif).toBuffer();
  const maskableBuf = await sharp({
    create: { width: maskableCanvas, height: maskableCanvas, channels: 4, background: CREAM },
  })
    .composite([{ input: motifBuf, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, 'pwa-maskable-512.png'), maskableBuf);
  console.log(`pwa-maskable-512.png erzeugt (${(maskableBuf.length / 1024).toFixed(0)} KB)`);

  // Apple Touch Icon: iOS stellt Transparenz als Schwarz dar -> deckender Hintergrund nötig
  const appleBuf = await sharp(src)
    .resize(180, 180)
    .flatten({ background: CREAM })
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toBuffer();
  fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleBuf);
  console.log(`apple-touch-icon.png erzeugt (${(appleBuf.length / 1024).toFixed(0)} KB)`);

  // Favicon: kleine transparente PNG-Variante
  const faviconBuf = await sharp(src).resize(64, 64).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(path.join(outDir, 'favicon.png'), faviconBuf);
  console.log(`favicon.png erzeugt (${(faviconBuf.length / 1024).toFixed(0)} KB)`);
}

run();
