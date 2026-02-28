'use client';

import React from 'react';
import { applyCepMask, applyCnpjMask, applyCpfMask, applyCurrencyMask, applyPhoneMask, applyPercentMask } from '@/src/shared/masks';
import { isValidCnpj, isValidCpf } from '@/src/shared/validators';
import { cn } from '@/lib/utils';

type MaskType = 'cpf' | 'cnpj' | 'cep' | 'currency' | 'phone' | 'document' | 'percent';

type MaskedInputProps = {
  type: MaskType;
  value: string | number;
  onChange: (rawValue: string | number) => void;
  onValidityChange?: (valid: boolean) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function MaskedInput({
  type,
  value,
  onChange,
  onValidityChange,
  className,
  placeholder,
  disabled = false,
}: MaskedInputProps) {
  const [display, setDisplay] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const str = typeof value === 'number' ? String(value) : value ?? '';
    let next = '';
    switch (type) {
      case 'currency': {
        const { display: d } = applyCurrencyMask(str);
        next = d;
        break;
      }
      case 'cep': {
        const { display: d } = applyCepMask(str);
        next = d;
        break;
      }
      case 'cpf': {
        const { display: d } = applyCpfMask(str);
        next = d;
        break;
      }
      case 'cnpj': {
        const { display: d } = applyCnpjMask(str);
        next = d;
        break;
      }
      case 'phone': {
        const { display: d } = applyPhoneMask(str);
        next = d;
        break;
      }
      case 'percent': {
        const { display: d } = applyPercentMask(str);
        next = d;
        break;
      }
      case 'document': {
        const digits = str.replace(/\D/g, '');
        if (digits.length <= 11) {
          const { display: d } = applyCpfMask(digits);
          next = d;
        } else {
          const { display: d } = applyCnpjMask(digits);
          next = d;
        }
        break;
      }
      default:
        next = str;
    }
    setDisplay(next);
  }, [type, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    switch (type) {
      case 'currency': {
        const { raw, display: d } = applyCurrencyMask(input);
        setDisplay(d);
        onChange(raw);
        setError(null);
        onValidityChange?.(true);
        break;
      }
      case 'cep': {
        const { raw, display: d } = applyCepMask(input);
        setDisplay(d);
        onChange(raw);
        const valid = raw.length === 8;
        setError(valid ? null : 'CEP inválido');
        onValidityChange?.(valid);
        break;
      }
      case 'cpf': {
        const { raw, display: d } = applyCpfMask(input);
        setDisplay(d);
        onChange(raw);
        const valid = raw.length === 11 && isValidCpf(raw);
        setError(valid ? null : 'CPF inválido');
        onValidityChange?.(valid);
        break;
      }
      case 'cnpj': {
        const { raw, display: d } = applyCnpjMask(input);
        setDisplay(d);
        onChange(raw);
        const valid = raw.length === 14 && isValidCnpj(raw);
        setError(valid ? null : 'CNPJ inválido');
        onValidityChange?.(valid);
        break;
      }
      case 'phone': {
        const { raw, display: d } = applyPhoneMask(input);
        setDisplay(d);
        onChange(raw);
        const valid = raw.length === 10 || raw.length === 11;
        setError(valid ? null : 'Telefone inválido');
        onValidityChange?.(valid);
        break;
      }
      case 'percent': {
        const { raw, display: d } = applyPercentMask(input);
        setDisplay(d);
        onChange(raw);
        setError(null);
        onValidityChange?.(true);
        break;
      }
      case 'document': {
        const digits = input.replace(/\D/g, '');
        if (digits.length <= 11) {
          const { raw, display: d } = applyCpfMask(digits);
          setDisplay(d);
          onChange(raw);
          const valid = raw.length === 11 && isValidCpf(raw);
          setError(valid ? null : 'CPF inválido');
          onValidityChange?.(valid);
        } else {
          const { raw, display: d } = applyCnpjMask(digits);
          setDisplay(d);
          onChange(raw);
          const valid = raw.length === 14 && isValidCnpj(raw);
          setError(valid ? null : 'CNPJ inválido');
          onValidityChange?.(valid);
        }
        break;
      }
      default:
        setDisplay(input);
        onChange(input);
        setError(null);
        onValidityChange?.(true);
    }
  };

  const inputMode =
    type === 'phone' ? 'tel' : type === 'currency' || type === 'cep' || type === 'cpf' || type === 'cnpj' || type === 'document' || type === 'percent'
      ? 'numeric'
      : 'text';

  return (
    <div className="space-y-1">
      <input
        value={display}
        onChange={handleChange}
        inputMode={inputMode as React.HTMLAttributes<HTMLInputElement>['inputMode']}
        className={cn('h-11 w-full rounded-md border border-input bg-background px-3 text-sm', className)}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && <div className="text-[11px] text-destructive">{error}</div>}
    </div>
  );
}
