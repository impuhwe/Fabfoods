import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const SIZES = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11',
};

export const IconButton = forwardRef(function IconButton(
  { label, size = 'md', className, children, type = 'button', ...props },
  ref,
) {
  if (!label) throw new Error('IconButton requires an accessible label');

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full text-cocoa-700 transition-colors',
        'hover:bg-cream-200 hover:text-cocoa-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        SIZES[size] ?? SIZES.md,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export default IconButton;
