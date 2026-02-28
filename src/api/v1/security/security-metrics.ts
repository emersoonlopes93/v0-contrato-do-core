type Counters = {
  [k: string]: number;
};

const counters: Counters = {};

function inc(key: string) {
  counters[key] = (counters[key] ?? 0) + 1;
}

export function logLoginFailure(context: 'tenant' | 'admin', ip: string, email: string) {
  inc(`login.failure.${context}.ip.${ip}`);
  inc(`login.failure.${context}.email.${email.toLowerCase()}`);
}

export function logLoginSuccess(context: 'tenant' | 'admin', ip: string, email: string) {
  inc(`login.success.${context}.ip.${ip}`);
  inc(`login.success.${context}.email.${email.toLowerCase()}`);
}

export function snapshotMetrics(): Record<string, number> {
  return { ...counters };
}
