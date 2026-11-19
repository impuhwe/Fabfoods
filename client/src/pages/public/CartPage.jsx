import { Link } from 'react-router-dom';
import { ShoppingBag, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import QuantityStepper from '../../components/public/QuantityStepper.jsx';
import usePageMeta from '../../hooks/usePageMeta.js';
import { useCart } from '../../contexts/CartContext.jsx';
import { formatRwf } from '../../lib/format.js';

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();

  usePageMeta({
    title: 'Your order',
    description: 'Review your FAB FOODS order before checkout.',
  });

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your order is empty"
          description="Add something from the menu to get started."
          action={
            <Button asChild variant="order">
              <Link to="/menu">Explore the menu</Link>
            </Button>
          }
        />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:py-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
            Your order
          </p>
          <h1 className="mt-3 font-display text-display-lg font-semibold text-cocoa-950">
            Review your table.
          </h1>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-sm font-medium text-cocoa-500 underline hover:text-danger"
        >
          Clear order
        </button>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-cocoa-900/10 border-y border-cocoa-900/10">
          {items.map((line) => (
            <li key={line.id} className="py-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/menu/${line.slug}`}
                      className="font-display text-lg font-semibold text-cocoa-950 hover:text-ember-700"
                    >
                      {line.name}
                    </Link>
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
                    className="rounded-full p-2 text-cocoa-400 hover:bg-cream-200 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(value) => updateQuantity(line.id, value)}
                    label={line.name}
                    className="h-10 [&>button]:h-10 [&>button]:w-10"
                  />
                  <p className="font-price text-lg font-semibold text-cocoa-900">
                    {formatRwf(line.unitPrice * line.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-cocoa-900/10 bg-cream-50 p-6">
          <h2 className="font-display text-xl font-semibold text-cocoa-950">Summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-cocoa-600">Subtotal</span>
            <span className="font-price text-lg font-semibold">{formatRwf(subtotal)}</span>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-cocoa-500">
            This is an estimate. The restaurant confirms prices, availability and pickup timing at
            checkout.
          </p>
          <Button asChild variant="order" size="lg" className="mt-5 w-full">
            <Link to="/checkout">Continue to checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link to="/menu">Add more items</Link>
          </Button>
        </aside>
      </div>
    </section>
  );
}

export default CartPage;
