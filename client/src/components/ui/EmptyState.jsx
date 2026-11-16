import { cn } from '../../lib/cn.js';

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed border-cocoa-900/20 bg-cream-50 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon ? (
        <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-cream-200 text-cocoa-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
      ) : null}
      <h2 className="font-display text-xl font-semibold text-cocoa-900">{title}</h2>
      {description ? <p className="mt-2 max-w-md text-sm text-cocoa-600">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
