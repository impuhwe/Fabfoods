import { Link } from 'react-router-dom';
import { ArrowUpRight, Plus } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import { formatRwf } from '../../lib/format.js';
import { menuItemImage } from '../../lib/imagery.js';
import MenuImage from './MenuImage.jsx';
import { useCart } from '../../contexts/CartContext.jsx';
import { useToast } from '../../contexts/ToastContext.jsx';

export function MenuItemCard({ item }) {
  const { addItem } = useCart();
  const { addToast } = useToast();
  const hasOptions = item.hasSizeOptions || item.hasServingOptions || item.hasAddonGroups;
  const image = menuItemImage(item);

  function quickAdd() {
    addItem(
      {
        ...item,
        image,
        imageAlt: item.image?.alt || `Illustrative image for ${item.name}`,
      },
      {
        quantity: 1,
        unitPrice: item.price,
        selectionSummary: [],
      },
    );
    addToast({ title: `${item.name} added`, variant: 'success' });
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-cocoa-900/10 bg-white transition-shadow duration-300 hover:shadow-lift">
      <Link
        to={`/menu/${item.slug}`}
        className="relative block aspect-[4/3] overflow-hidden bg-cream-200"
        tabIndex={-1}
        aria-hidden="true"
      >
        <MenuImage
          item={item}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-cocoa-950/35 to-transparent" />
        {!item.isOrderable ? (
          <span className="absolute left-3 top-3 rounded-full bg-cream-50/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cocoa-700">
            Awaiting confirmation
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cocoa-500">
              {item.category?.name ?? 'Kitchen'}
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold leading-tight text-cocoa-950">
              <Link to={`/menu/${item.slug}`} className="hover:text-ember-700">
                {item.name}
              </Link>
            </h3>
          </div>
          <p className="font-price shrink-0 pt-5 text-lg font-semibold text-cocoa-900">
            {item.hasSizeOptions ? (
              <span className="mr-1 text-xs font-normal text-cocoa-500">from</span>
            ) : null}
            {formatRwf(item.price)}
          </p>
        </div>

        {item.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cocoa-600">
            {item.description}
          </p>
        ) : null}

        {item.includedItems?.length ? (
          <p className="mt-2 line-clamp-1 text-xs text-cocoa-500">
            Includes {item.includedItems.length} items
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Badge variant={item.isOrderable ? 'success' : 'neutral'} dot>
            {item.isOrderable ? 'Available' : 'Not orderable yet'}
          </Badge>

          {item.isOrderable && !hasOptions ? (
            <Button size="sm" onClick={quickAdd}>
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
      </div>
    </article>
  );
}

export default MenuItemCard;
