'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'

import { cn } from '@/lib/utils'

export type BaseModalSize = 'sm' | 'md' | 'lg'

export interface BaseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: BaseModalSize
  children: React.ReactNode
}

export function BaseModal({ open, onOpenChange, size = 'md', children }: BaseModalProps) {
  const sizeClass =
    size === 'sm'
      ? 'sm:max-w-[480px]'
      : size === 'lg'
        ? 'sm:max-w-[800px]'
        : 'sm:max-w-[640px]'

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-h-[90vh] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            sizeClass,
          )}
        >
          <div className="flex max-h-[90vh] flex-col overflow-hidden">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
