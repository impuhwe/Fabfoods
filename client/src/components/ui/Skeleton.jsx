import { cn } from '../../lib/cn.js';

export function Skeleton({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn('block animate-pulse rounded-xl bg-cream-300/70', className)}
    />
  );
}

export default Skeleton;
