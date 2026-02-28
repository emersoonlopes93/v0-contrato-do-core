import { formatCurrencyBr } from '@/src/shared/formatters';

export function applyCurrencyMask(input: string): { display: string; raw: number } {
  const digits = input.replace(/\D/g, '');
  const raw = digits === '' ? 0 : Number(digits);
  const display = formatCurrencyBr(raw);
  return { display, raw };
}

export function applyCepMask(input: string): { display: string; raw: string } {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  const display = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  return { display, raw: digits };
}

export function applyCpfMask(input: string): { display: string; raw: string } {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  const display =
    digits.length > 9
      ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
      : digits.length > 6
        ? `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
        : digits.length > 3
          ? `${digits.slice(0, 3)}.${digits.slice(3)}`
          : digits;
  return { display, raw: digits };
}

export function applyCnpjMask(input: string): { display: string; raw: string } {
  const digits = input.replace(/\D/g, '').slice(0, 14);
  const display =
    digits.length > 12
      ? `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
      : digits;
  return { display, raw: digits };
}

export function applyPhoneMask(input: string): { display: string; raw: string } {
  const digits = input.replace(/\D/g, '').slice(0, 11);
  const display =
    digits.length > 10
      ? `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
      : digits.length > 6
        ? `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
        : digits.length > 2
          ? `(${digits.slice(0, 2)}) ${digits.slice(2)}`
          : digits;
  return { display, raw: digits };
}

export function applyPercentMask(input: string): { display: string; raw: number } {
  const clean = input.replace(/[^\d,]/g, '');
  const parts = clean.split(',');
  const integer = parts[0] ?? '';
  const decimal = (parts[1] ?? '').slice(0, 2);
  const display = decimal.length > 0 ? `${integer},${decimal}%` : `${integer}%`;
  const raw = Number(`${integer}.${decimal || '0'}`);
  return { display, raw };
}
