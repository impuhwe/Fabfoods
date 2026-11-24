import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';

const triggerClasses =
  'group flex h-[42px] w-full items-center justify-between gap-3 rounded-xl border border-cocoa-900/20 bg-white py-1.5 pl-4 pr-1.5 text-sm text-cocoa-900 shadow-sm transition-colors ' +
  'hover:border-ember-400/70 focus-visible:border-ember-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember-400/40 ' +
  'disabled:cursor-not-allowed disabled:bg-cream-200 disabled:text-cocoa-500 ' +
  'aria-[invalid=true]:border-danger aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-danger/20 ' +
  '[&_[data-placeholder]]:text-cocoa-400';

export const SelectMenu = forwardRef(function SelectMenu(
  {
    value,
    onValueChange,
    options,
    placeholder = 'Select an option',
    disabled = false,
    invalid = false,
    className,
    id,
    name,
    required,
    onBlur,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
  },
  ref,
) {
  const hasError = Boolean(invalid || ariaInvalid);

  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      onOpenChange={(open) => {
        if (!open) onBlur?.();
      }}
      disabled={disabled}
      name={name}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        id={id}
        aria-describedby={ariaDescribedBy}
        aria-invalid={hasError || undefined}
        aria-required={Boolean(required || ariaRequired) || undefined}
        className={cn(triggerClasses, hasError && 'border-danger', className)}
      >
        <SelectPrimitive.Value placeholder={placeholder} className="truncate" />
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-cocoa-900/10 bg-cream-50 text-cocoa-600 transition group-hover:border-ember-400/60 group-hover:text-ember-700 group-data-[state=open]:border-ember-400 group-data-[state=open]:bg-ember-500/10 group-data-[state=open]:text-ember-700">
          <ChevronDown
            className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </span>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={8}
          collisionPadding={16}
          className="z-50 max-h-72 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-cocoa-900/10 bg-white shadow-lift"
        >
          <SelectPrimitive.Viewport className="max-h-[17rem] overflow-y-auto p-1.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-sm text-cocoa-800 outline-none transition focus-visible:ring-2 focus-visible:ring-ember-400/60 data-[disabled]:cursor-not-allowed data-[disabled]:text-cocoa-300 data-[disabled]:line-through data-[disabled]:opacity-50 data-[highlighted]:bg-cream-100 data-[highlighted]:text-ember-700 data-[state=checked]:bg-ember-500/10 data-[state=checked]:font-semibold data-[state=checked]:text-ember-800"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 inline-flex items-center">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ember-500 text-white">
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});

export default SelectMenu;
