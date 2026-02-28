export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const calc = (base: string, factor: number): number => {
    let total = 0;
    for (let i = 0; i < base.length; i++) total += Number(base[i]) * (factor - i);
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const base = digits.slice(0, 9);
  const d1 = calc(base, 10);
  const d2 = calc(base + d1.toString(), 11);
  return digits.endsWith(`${d1}${d2}`);
}

export function isValidCnpj(digits: string): boolean {
  if (!/^\d{14}$/.test(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  const calc = (base: string, factors: number[]): number => {
    let total = 0;
    for (let i = 0; i < base.length; i++) total += Number(base[i]) * (factors[i] ?? 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const base = digits.slice(0, 12);
  const d1 = calc(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calc(base + d1.toString(), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${d1}${d2}`);
}

export function isValidCep(digits: string): boolean {
  return /^\d{8}$/.test(digits);
}
