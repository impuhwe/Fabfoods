import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';
import { inputClasses } from './Input.jsx';

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(inputClasses, 'pr-9', className)} {...props}>
      {children}
    </select>
  );
});

export default Select;
