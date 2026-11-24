import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { formatRwf } from '../../lib/format.js';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export function MenuItemCard({ item }) {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const hasOptions = item.hasSizeOptions || item.hasServingOptions || item.hasAddonGroups;

  function quickAdd() {
    addItem(item, {
      quantity: 1,
      unitPrice: item.price,
      selectionSummary: [],
    });
    addToast({ title: `${item.name} added`, variant: 'success' });
  }

  return (
    <article className="flex h-full flex-col justify-between border-b border-cocoa-900/10 bg-white px-4 py-5 sm:px-5">
      <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cocoa-500">
            {item.category?.name ?? 'Kitchen'}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold leading-tight text-cocoa-950 sm:text-xl">
            <Link to={`/menu/${item.slug}`} className="hover:text-ember-700">
              {item.name}
            </Link>
          </h3>
        </div>
        <p className="font-price shrink-0 text-base font-semibold text-cocoa-900 sm:text-right sm:text-lg">
          {item.hasSizeOptions ? (
            <span className="mr-1 text-xs font-normal text-cocoa-500">from</span>
          ) : null}
          {formatRwf(item.price)}
        </p>
      </div>

      {item.description ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cocoa-600">{item.description}</p>
      ) : null}

      {item.includedItems?.length ? (
        <p className="mt-2 text-xs text-cocoa-500">Includes {item.includedItems.length} items</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Badge variant={item.isOrderable ? 'success' : 'neutral'} dot>
          {item.isOrderable ? 'Available' : 'Unavailable online'}
        </Badge>

        {item.isOrderable && !hasOptions ? (
          <Button size="sm" variant="order" onClick={quickAdd}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        ) : (
          <Link
            to={`/menu/${item.slug}`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cocoa-900/20 px-4 text-sm font-semibold text-cocoa-900 transition-colors hover:bg-cream-200"
          >
            {hasOptions ? 'Choose options' : 'View dish'}
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default MenuItemCard;
