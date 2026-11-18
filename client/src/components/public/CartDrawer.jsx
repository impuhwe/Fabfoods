import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Drawer from '../ui/Drawer.jsx';
import Button from '../ui/Button.jsx';
import QuantityStepper from './QuantityStepper.jsx';
import { formatRwf } from '../../lib/format.js';
import { useCart } from '../../contexts/CartContext.jsx';

export function CartDrawer() {
  const { items, isOpen, closeCart, subtotal, updateQuantity, removeItem } = useCart();

  return (
    <Drawer open={isOpen} onClose={closeCart} title="Your order">
      {items.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-200 text-cocoa-600">
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-4 font-display text-xl font-semibold text-cocoa-950">
            Your order is empty
          </p>
          <p className="mt-2 max-w-[16rem] text-sm text-cocoa-600">
            Browse the menu and add something from the kitchen.
          </p>
          <Button asChild className="mt-6" onClick={closeCart}>
            <Link to="/menu">Explore the menu</Link>
          </Button>
        </div>
      ) : (
        <div className="flex min-h-full flex-col">
          <ul className="divide-y divide-cocoa-900/10">
            {items.map((line) => (
              <li key={line.id} className="py-4 first:pt-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold leading-tight text-cocoa-950">
                        {line.name}
                      </p>
                      {line.selectionSummary?.length ? (
                        <p className="mt-1 text-xs leading-relaxed text-cocoa-500">
                          {line.selectionSummary.join(' · ')}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.id)}
                      aria-label={`Remove ${line.name}`}
                      className="rounded-full p-1.5 text-cocoa-400 transition-colors hover:bg-cream-200 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <QuantityStepper
                      value={line.quantity}
                      onChange={(value) => updateQuantity(line.id, value)}
                      label={line.name}
                      className="h-9 [&>button]:h-9 [&>button]:w-9"
                    />
                    <p className="font-price text-base font-semibold text-cocoa-900">
                      {formatRwf(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 border-t border-cocoa-900/10 pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-cocoa-600">Subtotal</span>
              <span className="font-price text-lg font-semibold text-cocoa-950">
                {formatRwf(subtotal)}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-cocoa-500">
              Prices are confirmed by the restaurant at checkout.
            </p>
            <div className="mt-4 grid gap-2">
              <Button asChild onClick={closeCart}>
                <Link to="/checkout">Review checkout</Link>
              </Button>
              <Button asChild variant="secondary" onClick={closeCart}>
                <Link to="/cart">View full order</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

export default CartDrawer;
