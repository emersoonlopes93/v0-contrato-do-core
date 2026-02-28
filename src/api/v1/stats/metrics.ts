type Counter = { name: string; help: string; value: number }
type Histogram = { name: string; help: string; buckets: number[]; counts: number[] }

class MetricsRegistry {
  private counters: Map<string, Counter> = new Map()
  private histograms: Map<string, Histogram> = new Map()

  counter(name: string, help: string): void {
    if (!this.counters.has(name)) {
      this.counters.set(name, { name, help, value: 0 })
    }
  }
  inc(name: string, v: number = 1): void {
    const c = this.counters.get(name)
    if (c) c.value += v
  }
  histogram(name: string, help: string, buckets: number[]): void {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, { name, help, buckets, counts: buckets.map(() => 0) })
    }
  }
  observe(name: string, v: number): void {
    const h = this.histograms.get(name)
    if (!h) return
    for (let i = 0; i < h.buckets.length; i++) {
      if (v <= h.buckets[i]!) {
        h.counts[i]! += 1
        return
      }
    }
    h.counts[h.counts.length - 1]! += 1
  }
  renderPrometheus(): string {
    const lines: string[] = []
    for (const c of this.counters.values()) {
      lines.push(`# HELP ${c.name} ${c.help}`)
      lines.push(`# TYPE ${c.name} counter`)
      lines.push(`${c.name} ${c.value}`)
    }
    for (const h of this.histograms.values()) {
      lines.push(`# HELP ${h.name} ${h.help}`)
      lines.push(`# TYPE ${h.name} histogram`)
      let sum = 0
      for (let i = 0; i < h.buckets.length; i++) {
        sum += h.counts[i]!
        lines.push(`${h.name}_bucket{le="${h.buckets[i]}"} ${sum}`)
      }
      lines.push(`${h.name}_count ${sum}`)
    }
    return lines.join('\n')
  }
}

export const metrics = new MetricsRegistry()

metrics.counter('error_rate', 'Number of error responses')
metrics.counter('login_failures', 'Number of login failures')
metrics.counter('lockouts', 'Number of lockouts applied')
metrics.counter('rate_limit_hits', 'Number of rate limit hits')
metrics.counter('mfa_failures', 'Number of MFA failures')
metrics.counter('stepup_failures', 'Number of StepUp failures')
metrics.histogram('request_duration', 'Request duration in ms', [50, 100, 200, 500, 1000, 2000])

export const recordLoginFailureMetric = (): void => metrics.inc('login_failures')
export const recordLockoutMetric = (): void => metrics.inc('lockouts')
export const recordRateLimitMetric = (): void => metrics.inc('rate_limit_hits')
export const recordMfaFailureMetric = (): void => metrics.inc('mfa_failures')
export const recordStepupFailureMetric = (): void => metrics.inc('stepup_failures')
export const observeDuration = (ms: number): void => metrics.observe('request_duration', ms)
