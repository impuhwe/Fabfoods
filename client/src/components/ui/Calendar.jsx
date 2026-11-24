import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { cn } from '../../lib/cn.js';

const calendarClassNames = {
  root: cn(
    'rdp-root relative bg-transparent text-cocoa-900',
    '[--rdp-day-height:2.25rem] [--rdp-day-width:2.25rem]',
    '[--rdp-day_button-border-radius:9999px] [--rdp-day_button-height:2.25rem]',
    '[--rdp-day_button-width:2.25rem] [--rdp-nav_button-height:2rem]',
    '[--rdp-nav_button-width:2rem]',
  ),
  months: 'rdp-months flex justify-center',
  month: 'rdp-month space-y-2',
  month_caption: 'rdp-month_caption flex h-9 items-center justify-center',
  caption_label:
    'rdp-caption_label font-display text-sm font-semibold tracking-wide text-cocoa-900',
  nav: 'rdp-nav absolute inset-x-0 top-0 flex items-center justify-between',
  button_previous:
    'rdp-button_previous flex items-center justify-center rounded-full text-cocoa-700 transition hover:bg-cream-200 hover:text-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400',
  button_next:
    'rdp-button_next flex items-center justify-center rounded-full text-cocoa-700 transition hover:bg-cream-200 hover:text-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400',
  chevron: 'rdp-chevron h-4 w-4 fill-current',
  month_grid: 'rdp-month_grid w-full border-collapse',
  weekdays: 'rdp-weekdays flex',
  weekday: 'rdp-weekday w-9 text-[0.68rem] font-semibold uppercase tracking-wider text-cocoa-400',
  week: 'rdp-week flex',
  day: 'rdp-day text-center text-sm',
  day_button:
    'rdp-day_button mx-auto flex items-center justify-center rounded-full text-cocoa-800 transition hover:bg-cream-200 hover:text-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400',
  disabled:
    'rdp-disabled [&_.rdp-day_button]:cursor-not-allowed [&_.rdp-day_button]:text-cocoa-300 [&_.rdp-day_button]:opacity-40 [&_.rdp-day_button]:hover:bg-transparent',
  selected:
    'rdp-selected [&_.rdp-day_button]:!bg-ember-600 [&_.rdp-day_button]:!font-semibold [&_.rdp-day_button]:!text-white [&_.rdp-day_button]:hover:!bg-ember-700',
  today: 'rdp-today [&_.rdp-day_button]:ring-1 [&_.rdp-day_button]:ring-ember-400',
  outside: 'rdp-outside invisible',
  hidden: 'rdp-hidden hidden',
};

export function Calendar({ className, classNames, ...props }) {
  return (
    <DayPicker
      className={cn('p-1', className)}
      classNames={{ ...calendarClassNames, ...classNames }}
      {...props}
    />
  );
}
