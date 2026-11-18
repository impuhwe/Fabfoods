import { useEffect, useState } from 'react';
import {
  HIGH_PRIORITY_IMAGE_PROPS,
  categoryImage,
  menuItemImage,
  resolveImageSrc,
} from '../../lib/imagery.js';

export function ResolvedImage({
  src,
  fallback,
  alt = '',
  className = '',
  priority = false,
  sizes,
  ...props
}) {
  const safeFallback = resolveImageSrc(fallback);
  const resolvedSrc = resolveImageSrc(src, safeFallback);
  const [currentSrc, setCurrentSrc] = useState(resolvedSrc);

  useEffect(() => {
    setCurrentSrc(resolvedSrc);
  }, [resolvedSrc]);

  return (
    <img
      {...props}
      {...(priority ? HIGH_PRIORITY_IMAGE_PROPS : {})}
      src={currentSrc}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      sizes={sizes}
      className={className}
      onError={() => {
        if (currentSrc !== safeFallback) setCurrentSrc(safeFallback);
      }}
    />
  );
}

export function MenuImage({ item, alt, priority = false, sizes, className = '', ...props }) {
  return (
    <ResolvedImage
      {...props}
      src={menuItemImage(item)}
      fallback={categoryImage(item?.category?.slug)}
      alt={
        alt ??
        item?.image?.alt ??
        (item?.name ? `Illustrative image for ${item.name}` : 'Menu item')
      }
      priority={priority}
      sizes={sizes}
      className={className}
    />
  );
}

export default MenuImage;
