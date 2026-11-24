import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MenuItemCard from './MenuItemCard.jsx';
import { CartProvider } from '../../contexts/CartContext.jsx';
import { ToastProvider } from '../../contexts/ToastContext.jsx';

const item = {
  id: 'item-1',
  slug: 'test-dish',
  name: 'Test Dish',
  description: 'A plainly described dish for menu verification.',
  price: 15000,
  image: 'https://example.com/test-dish.jpg',
  imageAlt: 'Test Dish',
  category: { name: 'Mains', slug: 'mains' },
  isOrderable: true,
  hasSizeOptions: false,
  hasServingOptions: false,
  hasAddonGroups: false,
};

function renderCard() {
  return render(
    <MemoryRouter>
      <CartProvider>
        <ToastProvider>
          <MenuItemCard item={item} />
        </ToastProvider>
      </CartProvider>
    </MemoryRouter>,
  );
}

describe('public text menu', () => {
  it('shows name, category, description and price without a product image', () => {
    const { container } = renderCard();

    expect(screen.getByRole('heading', { name: 'Test Dish' })).toBeTruthy();
    expect(screen.getByText('Mains')).toBeTruthy();
    expect(screen.getByText(item.description)).toBeTruthy();
    expect(screen.getByText(/15,000/)).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('picture')).toBeNull();
  });
});
