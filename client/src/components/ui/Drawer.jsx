import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useDialog } from '../../hooks/useDialog.js';
import IconButton from './IconButton.jsx';

export function Drawer({ open, onClose, title, children, side = 'right' }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useDialog(open, onClose, panelRef);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] bg-cocoa-950/50 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={[
          'absolute top-0 flex h-full w-[min(20rem,90vw)] flex-col border-cocoa-900/10 bg-cream-50 shadow-lift',
          side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-cocoa-900/10 px-5 py-4">
          <h2 id={titleId} className="font-display text-lg font-semibold">
            {title}
          </h2>
          <IconButton label={`Close ${title}`} onClick={onClose} size="sm">
            <X className="h-5 w-5" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

export default Drawer;
