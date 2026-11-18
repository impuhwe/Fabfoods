import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('verified typography', () => {
  it('loads Inter and Cardo from the verified Google Fonts families', () => {
    const html = read('../../index.html');
    expect(html).toContain('family=Cardo:ital,wght@0,400;0,700;1,400');
    expect(html).toContain('family=Inter:wght@100..900');
    expect(html).not.toContain('Cormorant');
  });

  it('uses Cardo for display and Inter for prices', () => {
    const config = read('../../tailwind.config.js');
    const css = read('../styles/index.css');
    expect(config).toContain("display: ['Cardo'");
    expect(config).not.toContain('Cormorant');
    expect(css).toContain('.customer-ui :is(h1, h2, h3, h4)');
    expect(css).toContain("theme('fontFamily.display')");
    expect(css).toContain('.customer-ui .font-price {\n    @apply font-sans;');
  });
});
