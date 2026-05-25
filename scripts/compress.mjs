import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { statSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// __dirname is scripts/, so public/ is ../public
const publicDir = path.join(__dirname, '..', 'public');

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return bytes + ' B';
  }
}

async function scanAndCompress(dir) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);

      if (file.isDirectory()) {
        await scanAndCompress(fullPath);
      } else {
        const ext = path.extname(file.name).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          const originalStats = statSync(fullPath);
          const originalSize = originalStats.size;

          const baseName = path.basename(file.name, ext);
          const outputPath = path.join(dir, `${baseName}.webp`);

          try {
            const image = sharp(fullPath);
            const metadata = await image.metadata();

            await image
              .rotate()
              .resize({ width: 1920, withoutEnlargement: true })
              .webp({ quality: 70, effort: 6, smartSubsample: false })
              .toFile(outputPath);

            const newStats = statSync(outputPath);
            const newSize = newStats.size;

            console.log(`[OK] ${path.relative(publicDir, fullPath)}`);
            console.log(`     Width: ${metadata.width}px`);
            console.log(`     Size: ${formatSize(originalSize)} -> ${formatSize(newSize)}`);
          } catch (err) {
            console.error(`[ERROR] compressing ${fullPath}:`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.error(`[ERROR] scanning directory ${dir}:`, err.message);
  }
}

console.log('Starting image compression in public directory...');
scanAndCompress(publicDir).then(() => {
  console.log('Compression complete.');
});
