import { FlaskConical } from 'lucide-react';
import { DEMO_MODE } from '../../lib/demo.js';

export function DemoBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div
      role="status"
      data-testid="demo-banner"
      className="border-b border-ember-700/30 bg-ember-300/40 px-5 py-2 text-center text-xs font-semibold text-cocoa-800"
    >
      <span className="inline-flex flex-wrap items-center justify-center gap-2">
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
        Demo mode — sample data only. Orders, payments, reservations and messages are not sent to
        FAB FOODS.
      </span>
    </div>
  );
}

export default DemoBanner;
