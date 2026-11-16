import { describe, expect, it } from 'vitest';
import { formatRwf } from './format.js';

describe('formatRwf', () => {
  it('uses the ISO currency code and grouped digits', () => {
    expect(formatRwf(8000)).toBe('RWF 8,000');
    expect(formatRwf(12500)).toBe('RWF 12,500');
    expect(formatRwf(0)).toBe('RWF 0');
  });

  it('handles invalid values without throwing', () => {
    expect(formatRwf(undefined)).toBe('RWF 0');
    expect(formatRwf(Number.NaN)).toBe('RWF 0');
  });
});
