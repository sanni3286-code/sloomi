// Verkleinert und komprimiert die Faultier-Illustrationen aus public/sloth.
// Anzeigegröße in der App ist max. ~264px breit; 640px Kantenlänge deckt Retina-Displays
// komfortabel ab, ohne die PWA-Precache-Größe unnötig aufzublähen.
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, '..', 'public', 'sloth');
const files = ['idle.png', 'planning.png', 'running.png', 'paused.png', 'completed.png'];
const MAX_WIDTH = 640;

async function run() {
  for (const file of files) {
    const filePath = path.join(dir, file);
    const before = require('fs').statSync(filePath).size;
    const buffer = await sharp(filePath)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .png({ quality: 82, compressionLevel: 9, palette: true })
      .toBuffer();
    require('fs').writeFileSync(filePath, buffer);
    const after = buffer.length;
    console.log(`${file}: ${(before / 1024).toFixed(0)} KB -> ${(after / 1024).toFixed(0)} KB`);
  }
}

run();
