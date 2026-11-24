import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function QuantityStepper({ value, onChange, min = 1, max = 20, label = 'item', className }) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center rounded-full border border-cocoa-900/15 bg-white',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa-700 transition-colors hover:bg-cream-200 disabled:opacity-40"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase quantity of ${label}`}
        className="flex h-11 w-11 items-center justify-center rounded-full text-cocoa-700 transition-colors hover:bg-cream-200 disabled:opacity-40"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export default QuantityStepper;
