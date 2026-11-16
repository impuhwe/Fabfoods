import { cn } from '../../lib/cn.js';

const VARIANTS = {
  neutral: 'bg-cream-200 text-cocoa-700',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  ember: 'bg-ember-500/15 text-ember-700',
};

export function Badge({ variant = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
        VARIANTS[variant] ?? VARIANTS.neutral,
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default Badge;
