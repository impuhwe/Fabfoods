import fs from 'node:fs/promises';
import path from 'node:path';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const urls = process.argv.slice(2);
const targets = urls.length ? urls : ['http://127.0.0.1:5173/'];

const chrome = await launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

try {
  await fs.mkdir('qa/reports', { recursive: true });

  for (const url of targets) {
    const result = await lighthouse(url, {
      port: chrome.port,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    });

    const name = new URL(url).pathname.replaceAll('/', '_') || '_root';
    const reportPath = path.join('qa/reports', `lighthouse${name}.json`);
    await fs.writeFile(reportPath, result.report);

    const scores = Object.fromEntries(
      Object.entries(result.lhr.categories).map(([key, category]) => [
        key,
        Math.round(category.score * 100),
      ]),
    );
    console.log(`${url} ${JSON.stringify(scores)} -> ${reportPath}`);
  }
} finally {
  await chrome.kill();
}
