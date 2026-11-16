import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartProvider, useCart } from './CartContext.jsx';

const fries = {
  slug: 'french-fries',
  name: 'FRENCH FRIES',
  price: 4000,
  category: { name: 'Grill Corner' },
  image: 'https://example.com/fries.jpg',
};

const coffee = {
  slug: 'cappucino',
  name: 'Cappucino',
  price: 3000,
  category: { name: 'Hot Coffee' },
  image: 'https://example.com/coffee.jpg',
};

function CartProbe() {
  const cart = useCart();
  return (
    <div>
      <p data-testid="count">{cart.itemCount}</p>
      <p data-testid="subtotal">{cart.subtotal}</p>
      <p data-testid="lines">{cart.items.length}</p>
      <ul>
        {cart.items.map((line) => (
          <li key={line.id}>
            {line.name} x{line.quantity} {line.sizeLabel ?? ''}
            <button type="button" onClick={() => cart.updateQuantity(line.id, line.quantity + 1)}>
              More {line.name}
            </button>
            <button type="button" onClick={() => cart.removeItem(line.id)}>
              Remove {line.name}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => cart.addItem(fries, { quantity: 2 })}>
        Add fries
      </button>
      <button type="button" onClick={() => cart.addItem(fries, { quantity: 1 })}>
        Add another fries
      </button>
      <button
        type="button"
        onClick={() => cart.addItem(fries, { quantity: 1, sizeLabel: 'Large', unitPrice: 5000 })}
      >
        Add large fries
      </button>
      <button type="button" onClick={() => cart.addItem(coffee)}>
        Add coffee
      </button>
      <button type="button" onClick={cart.clearCart}>
        Clear
      </button>
    </div>
  );
}

function renderCart() {
  return render(
    <CartProvider>
      <CartProbe />
    </CartProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('CartProvider', () => {
  it('adds items, merges matching selections and totals the estimate', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole('button', { name: 'Add fries' }));
    expect(screen.getByTestId('count')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('8000');
    expect(screen.getByTestId('lines')).toHaveTextContent('1');

    await user.click(screen.getByRole('button', { name: 'Add another fries' }));
    expect(screen.getByTestId('count')).toHaveTextContent('3');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('12000');
    expect(screen.getByTestId('lines')).toHaveTextContent('1');
  });

  it('keeps different sizes and different products as separate lines', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole('button', { name: 'Add fries' }));
    await user.click(screen.getByRole('button', { name: 'Add large fries' }));
    await user.click(screen.getByRole('button', { name: 'Add coffee' }));

    expect(screen.getByTestId('lines')).toHaveTextContent('3');
    expect(screen.getByTestId('count')).toHaveTextContent('4');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('16000');
    expect(screen.getByText(/Large/)).toBeInTheDocument();
  });

  it('updates, removes and clears lines', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole('button', { name: 'Add fries' }));
    await user.click(screen.getByRole('button', { name: 'More FRENCH FRIES' }));
    expect(screen.getByTestId('count')).toHaveTextContent('3');

    await user.click(screen.getByRole('button', { name: 'Remove FRENCH FRIES' }));
    expect(screen.getByTestId('count')).toHaveTextContent('0');

    await user.click(screen.getByRole('button', { name: 'Add coffee' }));
    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.getByTestId('lines')).toHaveTextContent('0');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('0');
  });

  it('persists the cart to localStorage and restores it on mount', async () => {
    const user = userEvent.setup();
    const first = renderCart();

    await user.click(screen.getByRole('button', { name: 'Add coffee' }));
    expect(window.localStorage.getItem('ff_cart_v1')).toContain('cappucino');
    first.unmount();

    renderCart();
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('3000');
  });

  it('caps line quantities at twenty', async () => {
    const user = userEvent.setup();
    renderCart();

    await user.click(screen.getByRole('button', { name: 'Add fries' }));
    for (let index = 0; index < 20; index += 1) {
      await user.click(screen.getByRole('button', { name: 'More FRENCH FRIES' }));
    }

    expect(screen.getByTestId('count')).toHaveTextContent('20');
  });
});
