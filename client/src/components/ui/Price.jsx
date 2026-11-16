import { cn } from '../../lib/cn.js';
import { formatRwf } from '../../lib/format.js';

export function Price({ amount, className, suffix }) {
  return (
    <span className={cn('font-semibold tabular-nums text-cocoa-900', className)}>
      {formatRwf(amount)}
      {suffix ? <span className="ml-1 text-xs font-medium text-cocoa-500">{suffix}</span> : null}
    </span>
  );
}

export default Price;
