'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>

export function ModalBody({ className, ...props }: ModalBodyProps) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto px-4 py-3', className)}
      {...props}
    />
  )
}

