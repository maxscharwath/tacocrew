import * as SelectPrimitive from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import * as React from 'react';
import { cn } from './utils';

function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectValue({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn('flex items-center gap-3 min-w-0 flex-1', className)}
      {...props}
    />
  );
}

type SelectTriggerProps = React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: 'sm' | 'default';
  error?: boolean;
};

function SelectTrigger({
  className,
  size = 'default',
  error,
  children,
  ...props
}: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white transition-colors',
        'outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'data-[placeholder]:text-slate-400',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        '[&>*[data-slot=select-value]]:flex [&>*[data-slot=select-value]]:items-center [&>*[data-slot=select-value]]:gap-3 [&>*[data-slot=select-value]]:min-w-0 [&>*[data-slot=select-value]]:flex-1',
        'focus-visible:border-brand-400 focus-visible:ring-2 focus-visible:ring-brand-400/40',
        size === 'default' ? 'h-12' : 'h-10',
        error
          ? 'border-rose-400/50 bg-rose-500/10 focus-visible:border-rose-400 focus-visible:ring-rose-400/40'
          : 'border-gray-700',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50 shrink-0" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = 'popper',
  align = 'center',
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          'bg-slate-900/95 backdrop-blur-sm text-white border border-gray-700 shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'relative z-50 max-h-[var(--radix-select-content-available-height)] min-w-[8rem]',
          'origin-[var(--radix-select-content-transform-origin)] overflow-hidden rounded-2xl',
          position === 'popper' &&
            'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            'p-1',
            position === 'popper' &&
              'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('text-slate-400 px-2 py-1.5 text-xs font-medium', className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default select-none items-center gap-3 rounded-lg py-2.5 pr-8 pl-3 text-sm outline-none',
        'focus:bg-brand-500/20 focus:text-brand-100',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
        '[&>*]:flex [&>*]:items-center [&>*]:gap-3 [&>*]:min-w-0 [&>*]:flex-1',
        className
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-brand-400" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText className="flex items-center gap-3 min-w-0 flex-1">
        {children}
      </SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('bg-white/10 pointer-events-none -mx-1 my-1 h-px', className)}
      {...props}
    />
  );
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-slate-400',
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-slate-400',
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}

// Backward compatibility: Simple Select wrapper that matches the old API
type SimpleSelectProps = Omit<React.ComponentProps<'select'>, 'size'> & {
  size?: 'sm' | 'default';
  error?: boolean;
};

const SimpleSelect = React.forwardRef<HTMLSelectElement, SimpleSelectProps>(
  ({ className, size = 'default', error, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'w-full rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white transition-colors',
          'outline-none',
          'focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>option]:bg-slate-900 [&>option]:text-white',
          size === 'default' ? 'h-12' : 'h-10',
          error
            ? 'border-rose-400/50 bg-rose-500/10 focus:border-rose-400 focus:ring-rose-400/40'
            : 'border-gray-700',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

SimpleSelect.displayName = 'SimpleSelect';

// MultiSelect for backward compatibility
type MultiSelectProps = SimpleSelectProps & {
  multiple: true;
};

const MultiSelect = React.forwardRef<HTMLSelectElement, MultiSelectProps>(
  ({ className, size = 'default', error, multiple, ...props }, ref) => {
    return (
      <select
        multiple={multiple}
        className={cn(
          'min-h-[7.5rem] w-full rounded-2xl border bg-slate-950/60 px-4 py-3 text-sm text-white transition-colors',
          'outline-none',
          'focus:border-brand-400 focus:ring-2 focus:ring-brand-400/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[&>option]:bg-slate-900 [&>option]:px-3 [&>option]:py-2 [&>option]:text-white',
          '[&>option:checked]:bg-brand-500/20 [&>option:checked]:text-brand-100',
          size === 'default' ? 'h-12' : 'h-10',
          error
            ? 'border-rose-400/50 bg-rose-500/10 focus:border-rose-400 focus:ring-rose-400/40'
            : 'border-gray-700',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

MultiSelect.displayName = 'MultiSelect';

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  SimpleSelect,
  MultiSelect,
};
