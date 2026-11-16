import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

export const Checkbox = forwardRef(function Checkbox(
  { label, description, className, id, ...props },
  ref,
) {
  return (
    <label
      htmlFor={id}
      className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-cocoa-800', className)}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-cocoa-300 text-ember-700 accent-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400 focus-visible:ring-offset-2"
        {...props}
      />
      <span>
        <span className="font-medium">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs text-cocoa-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
});

export default Checkbox;
