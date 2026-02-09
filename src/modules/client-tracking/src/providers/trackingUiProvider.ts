export function formatEta(value: number | null): string {
  if (value === null) return '—';
  return `${Math.round(value)} min`;
}
