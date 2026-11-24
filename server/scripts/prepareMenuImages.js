import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { menuImageEntries } from '../src/scripts/data/menu-images.manifest.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(currentDir, '../../client/public/images/menu');
const width = 1000;
const quality = 74;
const attempts = 3;

function imageUrlFor(sourceUrl) {
  const url = new URL(sourceUrl);
  url.searchParams.set('auto', 'compress');
  url.searchParams.set('cs', 'tinysrgb');
  url.searchParams.set('w', String(width));
  url.searchParams.set('q', String(quality));
  url.searchParams.set('fm', 'webp');
  return url.toString();
}

async function downloadImage(record, outputPath) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(imageUrlFor(record.imageUrl), {
        headers: { accept: 'image/webp,image/*' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/webp')) {
        throw new Error(`expected image/webp, got ${contentType || 'unknown'}`);
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1024) {
        throw new Error(`suspiciously small response (${bytes.length} bytes)`);
      }

      await writeFile(outputPath, bytes);
      return bytes.length;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }

  throw new Error(`${record.slug}: ${lastError?.message ?? 'download failed'}`);
}

await mkdir(outputDir, { recursive: true });

const results = [];
const failures = [];

for (const record of menuImageEntries()) {
  const outputPath = path.join(outputDir, record.filename);
  const exists = await access(outputPath)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    results.push({ slug: record.slug, skipped: true });
    console.log(`${record.slug}: already present`);
    continue;
  }

  try {
    const bytes = await downloadImage(record, outputPath);
    results.push({ slug: record.slug, bytes });
    console.log(`${record.slug}: ${bytes} bytes`);
  } catch (error) {
    failures.push(error.message);
    console.error(error.message);
  }
}

console.log(
  `Downloaded ${results.length}/${menuImageEntries().length} menu images to ${outputDir}`,
);

if (failures.length) {
  console.error(`Failures:\n${failures.join('\n')}`);
  process.exitCode = 1;
}
