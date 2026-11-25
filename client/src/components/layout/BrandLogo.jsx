import { BRAND_LOGO_IMAGE } from '../../lib/imagery.js';
import { cn } from '../../lib/cn.js';

export function BrandLogo({ className, compact = false, onDark = false }) {
  const image = (
    <img
      src={BRAND_LOGO_IMAGE}
      alt="FAB FOODS"
      className={cn(
        'w-auto object-contain',
        compact ? 'h-8' : 'h-10 sm:h-11',
        onDark ? '' : 'max-w-full',
      )}
    />
  );

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        onDark ? 'rounded-lg bg-cream-100 px-3 py-1.5 shadow-soft' : '',
        className,
      )}
    >
      {image}
    </span>
  );
}

export default BrandLogo;
