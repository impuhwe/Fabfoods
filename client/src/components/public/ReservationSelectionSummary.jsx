import { Trash2, UtensilsCrossed } from 'lucide-react';
import Badge from '../ui/Badge.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import Price from '../ui/Price.jsx';
import QuantityStepper from './QuantityStepper.jsx';

export function ReservationSelectionSummary({
  selections = [],
  currency = 'RWF',
  onQuantityChange,
  onRemove,
  compact = false,
}) {
  const subtotal = selections.reduce((total, line) => total + line.lineTotal, 0);
  const itemCount = selections.reduce((total, line) => total + line.quantity, 0);

  if (!selections.length) {
    return compact ? null : (
      <EmptyState
        icon={UtensilsCrossed}
        title="No food or drinks selected"
        description="That is fine — you can still send a table request with no pre-selection."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-cocoa-900/10 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cocoa-500">
            Your selection
          </p>
          <p className="mt-1 text-sm text-cocoa-600">
            {itemCount} {itemCount === 1 ? 'item' : 'items'} · estimate only
          </p>
        </div>
        <Badge variant="warning">Awaiting review</Badge>
      </div>

      <ul className="mt-4 divide-y divide-cocoa-900/10">
        {selections.map((line) => (
          <li key={line.key} className="py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-cocoa-950">{line.name}</p>
                  <p className="text-xs text-cocoa-500">{line.category}</p>
                </div>
                <Price amount={line.lineTotal} />
              </div>
              {line.selectionSummary?.length ? (
                <p className="mt-1 text-xs text-cocoa-600">{line.selectionSummary.join(' · ')}</p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {onQuantityChange ? (
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(quantity) => onQuantityChange(line.key, quantity)}
                    label={line.name}
                    className="h-9"
                  />
                ) : (
                  <span className="text-xs text-cocoa-600">Quantity {line.quantity}</span>
                )}
                {onRemove ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemove(line.key)}
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-cocoa-900/10 pt-4">
        <span className="text-sm font-semibold text-cocoa-800">Estimated total</span>
        <div className="text-right">
          <Price amount={subtotal} className="font-display text-xl" />
          <p className="text-[10px] uppercase tracking-[0.16em] text-cocoa-500">{currency}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-cocoa-500">
        This is not a food order. Nothing is charged; the restaurant reviews these selections
        separately.
      </p>
    </div>
  );
}

export default ReservationSelectionSummary;
