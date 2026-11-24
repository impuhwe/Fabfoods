import { cn } from '../../lib/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-3xl border border-cocoa-900/10 bg-white p-6 shadow-soft', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('mb-4 space-y-1', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return (
    <h2 className={cn('font-display text-xl font-semibold text-cocoa-900', className)}>
      {children}
    </h2>
  );
}

export function CardDescription({ className, children }) {
  return <p className={cn('text-sm text-cocoa-600', className)}>{children}</p>;
}

export default Card;
