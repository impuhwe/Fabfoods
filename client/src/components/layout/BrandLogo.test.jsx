import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import BrandLogo from './BrandLogo.jsx';

describe('BrandLogo', () => {
  it('uses the official logo asset with a meaningful alt text', () => {
    render(<BrandLogo />);

    const logo = screen.getByRole('img', { name: 'FAB FOODS' });
    expect(logo).toHaveAttribute('src', '/brand/fab-foods-logo.webp');
    expect(logo.className).toContain('w-auto');
    expect(logo.className).toContain('object-contain');
  });

  it('keeps the logo readable on dark surfaces', () => {
    const { container } = render(<BrandLogo onDark />);
    expect(container.firstChild.className).toContain('bg-cream-100');
  });
});
