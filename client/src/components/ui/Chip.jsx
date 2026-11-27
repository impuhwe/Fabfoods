import { cn } from '../../lib/cn.js';

export function Chip({ pressed = false, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={cn(
        'inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2',
        pressed
          ? 'border-cocoa-950 bg-cocoa-950 text-white'
          : 'border-cocoa-900/20 bg-transparent text-cocoa-700 hover:bg-cream-200',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default Chip;
