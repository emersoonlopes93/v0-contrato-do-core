'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  closeAriaLabel?: string
}

export function ModalHeader({
  title,
  closeAriaLabel,
  className,
  ...props
}: ModalHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3',
        className,
      )}
      {...props}
    >
      <DialogPrimitive.Title className="text-base font-semibold leading-none tracking-tight">
        {title}
      </DialogPrimitive.Title>
      <DialogPrimitive.Close
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={closeAriaLabel ?? 'Fechar modal'}
      >
        <X className="h-4 w-4" />
      </DialogPrimitive.Close>
    </header>
  )
}
