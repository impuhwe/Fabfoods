import { cn } from '../../lib/cn.js';

export function SectionHeading({ eyebrow, title, description, action, align = 'left', className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        align === 'center' && 'sm:flex-col sm:items-center sm:text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ember-700">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-display text-display-md font-semibold text-cocoa-950">{title}</h2>
        {description ? (
          <p className="mt-3 text-base leading-relaxed text-cocoa-600">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export default SectionHeading;
