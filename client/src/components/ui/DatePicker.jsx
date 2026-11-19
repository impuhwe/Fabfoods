import { forwardRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { CalendarDays } from 'lucide-react';
import { Calendar } from './Calendar.jsx';
import { inputClasses } from './Input.jsx';
import { cn } from '../../lib/cn.js';
import { formatDisplayDate, formatDateString, parseDateString } from '../../lib/calendarDate.js';

export const DatePicker = forwardRef(function DatePicker(
  {
    value,
    onChange,
    min,
    max,
    placeholder = 'Pick a date',
    disabled = false,
    invalid = false,
    className,
    id,
    name,
    required,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    ...props
  },
  ref,
) {
  const [open, setOpen] = useState(false);
  const selectedDate = parseDateString(value);
  const minDate = parseDateString(min);
  const maxDate = parseDateString(max);
  const hasError = Boolean(invalid || ariaInvalid);

  const disabledDays =
    minDate && maxDate
      ? { before: minDate, after: maxDate }
      : minDate
        ? { before: minDate }
        : maxDate
          ? { after: maxDate }
          : undefined;

  function handleSelect(date) {
    if (!date || Number.isNaN(date.getTime())) return;
    onChange(formatDateString(date));
    setOpen(false);
  }

  function handleClear(event) {
    event.preventDefault();
    onChange('');
    setOpen(false);
  }

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
    if (!nextOpen) props.onBlur?.();
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          ref={ref}
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          aria-describedby={ariaDescribedBy}
          aria-invalid={hasError || undefined}
          aria-required={Boolean(required || ariaRequired) || undefined}
          className={cn(
            inputClasses,
            'flex items-center justify-between gap-3 text-left',
            hasError && 'border-danger ring-1 ring-danger/20',
            className,
          )}
          {...props}
        >
          <span className={cn('truncate', !selectedDate && 'text-cocoa-400')}>
            {selectedDate ? formatDisplayDate(value) : placeholder}
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-cocoa-500" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 w-auto max-w-[calc(100vw-2rem)] rounded-2xl border border-cocoa-900/10 bg-white p-3 shadow-lift"
        >
          <Calendar
            mode="single"
            autoFocus
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? minDate}
            fromDate={minDate}
            toDate={maxDate}
            disabled={disabledDays}
            showOutsideDays={false}
          />
          {value ? (
            <div className="mt-2 flex justify-end border-t border-cocoa-900/10 pt-2">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cocoa-600 transition hover:bg-cream-200 hover:text-ember-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400"
              >
                Clear date
              </button>
            </div>
          ) : null}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
});

export default DatePicker;
