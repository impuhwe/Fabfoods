import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { REQUIRED_ENV_KEYS } from '../src/config/env.js';

describe('environment example', () => {
  it('documents every required environment key', () => {
    const path = fileURLToPath(new URL('../../.env.example', import.meta.url));
    const contents = readFileSync(path, 'utf8');

    for (const key of REQUIRED_ENV_KEYS) {
      expect(contents).toMatch(new RegExp(`^${key}=`, 'm'));
    }
  });

  it('does not contain real-looking production secrets', () => {
    const path = fileURLToPath(new URL('../../.env.example', import.meta.url));
    const contents = readFileSync(path, 'utf8');

    expect(contents).not.toMatch(/mongodb\+srv:\/\/.+@/);
  });
});
