import type { CashierCloseRequest, CashierOpenRequest, CashierSession } from '@/src/types/cashier';

function buildKey(tenantSlug: string): string {
  return `cashier-session:${tenantSlug}`;
}

function parseSession(raw: string | null): CashierSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CashierSession;
    if (
      typeof parsed.openedAt === 'string' &&
      typeof parsed.openingAmount === 'number' &&
      'closedAt' in parsed &&
      'closingAmount' in parsed
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function getCashierSession(tenantSlug: string): CashierSession | null {
  const raw = window.localStorage.getItem(buildKey(tenantSlug));
  return parseSession(raw);
}

export function openCashierSession(tenantSlug: string, input: CashierOpenRequest): CashierSession {
  const session: CashierSession = {
    openedAt: new Date().toISOString(),
    openingAmount: input.openingAmount,
    closedAt: null,
    closingAmount: null,
  };
  window.localStorage.setItem(buildKey(tenantSlug), JSON.stringify(session));
  return session;
}

export function closeCashierSession(tenantSlug: string, input: CashierCloseRequest): CashierSession {
  const existing = getCashierSession(tenantSlug);
  if (!existing) {
    throw new Error('Caixa ainda não foi aberto');
  }
  const closed: CashierSession = {
    ...existing,
    closedAt: new Date().toISOString(),
    closingAmount: input.closingAmount,
  };
  window.localStorage.setItem(buildKey(tenantSlug), JSON.stringify(closed));
  return closed;
}

export function clearCashierSession(tenantSlug: string): void {
  window.localStorage.removeItem(buildKey(tenantSlug));
}
