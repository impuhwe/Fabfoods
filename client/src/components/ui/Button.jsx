import { Children, cloneElement, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  primary:
    'bg-ember-500 text-cocoa-950 shadow-soft hover:bg-ember-400 active:bg-ember-600 disabled:hover:bg-ember-500',
  order:
    'bg-ember-500 text-white shadow-soft hover:bg-ember-400 active:bg-ember-600 disabled:hover:bg-ember-500',
  secondary:
    'border border-cocoa-900/20 bg-transparent text-cocoa-900 hover:bg-cream-200 active:bg-cream-300',
  ghost: 'bg-transparent text-cocoa-900 hover:bg-cream-200 active:bg-cream-300',
  danger: 'bg-danger text-cream-50 shadow-soft hover:bg-[#8f2f26] active:bg-[#7a2821]',
  onDark: 'bg-cream-100 text-cocoa-950 hover:bg-white active:bg-cream-200',
  honey:
    'bg-honey-500 text-cream-50 shadow-soft hover:bg-honey-400 active:bg-honey-600 disabled:hover:bg-honey-500',
  honeyOutline:
    'border border-honey-500 text-honey-500 bg-transparent hover:bg-honey-100 active:bg-honey-100/90',
};

const SIZES = {
  sm: 'h-9 gap-1.5 px-4 text-sm',
  md: 'h-11 gap-2 px-5 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
};

const BASE =
  'inline-flex select-none items-center justify-center whitespace-nowrap rounded-full font-semibold transition-colors duration-150 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-100 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    asChild = false,
    className,
    children,
    disabled = false,
    type = 'button',
    ...props
  },
  ref,
) {
  const classes = cn(
    BASE,
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    className,
  );

  if (asChild) {
    const child = Children.only(children);
    return cloneElement(child, {
      className: cn(classes, child.props.className),
      ...props,
    });
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
});

export default Button;
