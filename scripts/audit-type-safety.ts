import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// recria __dirname e __filename em ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// agora sim define ROOT
const ROOT = path.resolve(__dirname, '..')


const IGNORED_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage'
]

const IGNORED_PATTERNS = [
  '.spec.',
  '.test.',
  '__tests__'
]

const TARGET_EXT = ['.ts', '.tsx']

type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

interface Finding {
  file: string
  line: number
  content: string
  area: string
  severity: Severity
}

const findings: Finding[] = []

const ANY_PATTERNS = [
  /\bas any\b/,
  /:\s*any\b/,
  /<any>/,
  /unknown\s+as/,
  /\bany\[\]/,
]

function classifyArea(filePath: string): string {
  const lower = filePath.toLowerCase()

  if (lower.includes('core') || lower.includes('shared')) return 'CORE'
  if (lower.includes('finance') || lower.includes('caixa') || lower.includes('pdv') || lower.includes('billing')) return 'FINANCEIRO'
  if (lower.includes('delivery') || lower.includes('tracking') || lower.includes('route')) return 'LOGISTICA'
  if (lower.includes('crm') || lower.includes('customer')) return 'CRM'
  if (lower.includes('auth')) return 'AUTH'
  if (lower.includes('components') || lower.includes('pages')) return 'UI'

  return 'OUTROS'
}

function classifySeverity(area: string): Severity {
  if (area === 'CORE' || area === 'AUTH') return 'CRITICAL'
  if (area === 'FINANCEIRO' || area === 'LOGISTICA') return 'HIGH'
  if (area === 'CRM') return 'MEDIUM'
  return 'LOW'
}

function shouldIgnore(file: string) {
  if (IGNORED_DIRS.some(dir => file.includes(dir))) return true
  if (IGNORED_PATTERNS.some(p => file.includes(p))) return true
  return false
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, index) => {
    for (const pattern of ANY_PATTERNS) {
      if (pattern.test(line)) {
        const area = classifyArea(filePath)
        const severity = classifySeverity(area)

        findings.push({
          file: path.relative(ROOT, filePath),
          line: index + 1,
          content: line.trim(),
          area,
          severity
        })
      }
    }
  })
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir)

  for (const entry of entries) {
    const full = path.join(dir, entry)

    if (shouldIgnore(full)) continue

    const stat = fs.statSync(full)

    if (stat.isDirectory()) {
      walk(full)
    } else if (TARGET_EXT.includes(path.extname(full))) {
      scanFile(full)
    }
  }
}

function calculateScore() {
  const weights = {
    CRITICAL: 5,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  }

  return findings.reduce((acc, f) => acc + weights[f.severity], 0)
}

function generateJSONReport() {
  const report = {
    timestamp: new Date().toISOString(),
    totalFindings: findings.length,
    riskScore: calculateScore(),
    findings
  }

  fs.writeFileSync(
    path.join(ROOT, 'audit-type-safety-report.json'),
    JSON.stringify(report, null, 2)
  )
}

console.log('\n🔎 AUDITORIA ENTERPRISE — TYPE SAFETY\n')

walk(ROOT)

if (findings.length === 0) {
  console.log('✅ Projeto 100% limpo de ANY.')
  process.exit(0)
}

const grouped = findings.reduce((acc, f) => {
  acc[f.severity] = (acc[f.severity] || 0) + 1
  return acc
}, {} as Record<string, number>)

findings.forEach(f => {
  console.log(
    `[${f.severity}] (${f.area}) ${f.file}:${f.line}\n  → ${f.content}\n`
  )
})

console.log('----------------------------------------')
console.log(`TOTAL: ${findings.length}`)
console.log(`RISK SCORE: ${calculateScore()}`)
console.log('Resumo por severidade:', grouped)

generateJSONReport()

if (calculateScore() > 10) {
  console.log('\n🚨 RISCO ELEVADO — BLOQUEANDO BUILD')
  process.exit(1)
}

process.exit(0)
