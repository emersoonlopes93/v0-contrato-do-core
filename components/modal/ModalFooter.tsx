'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>

export function ModalFooter({ className, ...props }: ModalFooterProps) {
  return (
    <footer
      className={cn(
        'sticky bottom-0 z-10 flex flex-col gap-2 border-t bg-background px-4 py-3 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}
