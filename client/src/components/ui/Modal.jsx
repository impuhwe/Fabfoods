import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { useDialog } from '../../hooks/useDialog.js';
import IconButton from './IconButton.jsx';

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
  closeOnBackdrop = true,
}) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useDialog(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center overflow-y-auto bg-cocoa-950/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          'w-full animate-slide-up rounded-3xl border border-cocoa-900/10 bg-cream-50 shadow-lift',
          SIZES[size] ?? SIZES.md,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-cocoa-900/10 px-6 py-5">
          <div>
            <h2 id={titleId} className="font-display text-xl font-semibold text-cocoa-900">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-cocoa-600">
                {description}
              </p>
            ) : null}
          </div>
          <IconButton label="Close dialog" onClick={onClose} size="sm">
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-cocoa-900/10 px-6 py-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}

export default Modal;
