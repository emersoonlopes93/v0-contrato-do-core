'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    {...props}
    className={cn(
      'switch-safe peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
      'focus-visible:outline-none',
      'data-[state=checked]:bg-[var(--switch-track-on)]',
      'data-[state=unchecked]:bg-[var(--switch-track-off)]',
      'disabled:cursor-not-allowed',
      className,
    )}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'switch-safe-thumb pointer-events-none block h-5 w-5 rounded-full',
        'transition-transform',
        'data-[state=checked]:translate-x-5',
        'data-[state=unchecked]:translate-x-0',
        'bg-[var(--switch-thumb)]',
      )}
    />
  </SwitchPrimitives.Root>
))

Switch.displayName = 'Switch'

export { Switch }
