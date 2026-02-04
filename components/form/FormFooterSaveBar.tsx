import React from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export interface FormFooterSaveBarProps {
  isLoading?: boolean
  isDisabled?: boolean
  primaryLabel?: string
  primaryAriaLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  onCancel?: () => void
  className?: string
}

export function FormFooterSaveBar({
  isLoading,
  isDisabled,
  primaryLabel = 'Salvar',
  primaryAriaLabel,
  cancelLabel = 'Cancelar',
  showCancel,
  onCancel,
  className,
}: FormFooterSaveBarProps) {
  const disabled = Boolean(isDisabled || isLoading)

  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 border-t bg-background px-4 py-3',
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 md:flex-row md:items-center md:justify-end">
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full md:w-auto"
            onClick={onCancel}
            aria-label={cancelLabel}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          variant="default"
          className="h-11 w-full md:w-auto"
          disabled={disabled}
          aria-label={primaryAriaLabel ?? primaryLabel}
        >
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          {primaryLabel}
        </Button>
      </div>
    </div>
  )
}
