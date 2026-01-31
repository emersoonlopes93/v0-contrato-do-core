import * as React from 'react'
import { cn } from '@/lib/utils'

export type SpinnerProps = React.HTMLAttributes<HTMLDivElement>

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-2 border-current border-t-transparent text-primary", className)}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
