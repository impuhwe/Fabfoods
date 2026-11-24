import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const inputClasses =
  'w-full rounded-xl border border-cocoa-900/20 bg-white px-4 py-2.5 text-sm text-cocoa-900 shadow-sm placeholder:text-cocoa-400 transition-colors ' +
  'focus:border-ember-500 focus:outline-none focus:ring-2 focus:ring-ember-400/40 disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-cocoa-500';

export const Input = forwardRef(function Input({ className, type = 'text', ...props }, ref) {
  return <input ref={ref} type={type} className={cn(inputClasses, className)} {...props} />;
});

export default Input;
