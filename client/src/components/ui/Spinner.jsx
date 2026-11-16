import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Spinner({ label = 'Loading', className }) {
  return (
    <span
      role="status"
      className={cn('inline-flex items-center gap-2 text-sm text-cocoa-600', className)}
    >
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}

export default Spinner;
