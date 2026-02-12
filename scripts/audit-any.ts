import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.resolve(__dirname, '..')

const IGNORED_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.next',
  '.turbo',
  'coverage',
  'scripts',
  'logistics-ai'
]

const TARGET_EXTENSIONS = ['.ts', '.tsx']

type Severity = 'CRITICAL' | 'WARNING' | 'EXPERIMENTAL'
type Layer = 'CORE_SAFE' | 'BLOCKING' | 'EXPERIMENTAL'

interface Finding {
  file: string
  line: number
  content: string
  severity: Severity
  layer: Layer
  riskScore: number
}

const findings: Finding[] = []

// Padrões CRITICAL: uso explícito de any (pontos altos)
const CRITICAL_PATTERNS = [
  { pattern: /:\s*any\b/, score: 10, description: 'parâmetro tipado como any' },
  { pattern: /\bas any\b/, score: 10, description: 'cast explícito as any' },
  { pattern: /<any>/, score: 20, description: 'Promise<any> ou Array<any>' },
  { pattern: /\bany\[\]/, score: 10, description: 'array de any' },
]

// Padrões WARNING: casts técnicos (pontos baixos) - REMOVIDOS CONFORME REQUISIÇÃO
const WARNING_PATTERNS: Array<{ pattern: RegExp; score: number; description: string }> = [
  // Vazio - não classificamos mais Record<string, unknown> ou unknown as
]

// Exceções: não devem ser classificados como CRITICAL
const EXCEPTION_PATTERNS = [
  /Prisma\..*as unknown as/,  // casts envolvendo Prisma
  /Date.*as unknown/,         // casts envolvendo Date
  /delegate.*as/,             // casts envolvendo delegate
]

// Camadas de segurança
function classifyLayer(filePath: string): Layer {
  // Experimental: logistics-ai
  if (filePath.includes('logistics-ai')) {
    return 'EXPERIMENTAL'
  }
  
  // CORE_SAFE_LAYER: não bloquear
  if (filePath.includes('src/adapters/') ||
      filePath.includes('/repositories/') ||
      filePath.includes('/listeners/') ||
      filePath.includes('/services/') ||
      filePath.includes('src/api/')) {
    return 'CORE_SAFE'
  }
  
  // BLOCKING_LAYER: pode bloquear
  if (filePath.includes('finance') ||
      filePath.includes('billing') ||
      filePath.includes('settlement') ||
      filePath.includes('split') ||
      filePath.includes('auth') ||
      filePath.includes('rbac') ||
      filePath.includes('roles') ||
      filePath.includes('permissions')) {
    return 'BLOCKING'
  }
  
  // Default para segurança
  return 'BLOCKING'
}

function calculateRiskScore(filePath: string, line: string): number {
  // Verificar padrões CRITICAL primeiro
  for (const { pattern, score } of CRITICAL_PATTERNS) {
    if (pattern.test(line)) {
      return score
    }
  }
  
  // Verificar padrões WARNING
  for (const { pattern, score } of WARNING_PATTERNS) {
    if (pattern.test(line)) {
      return score
    }
  }
  
  return 0
}

function classifySeverity(filePath: string, line: string, riskScore: number, layer: Layer): Severity {
  // Experimental: logistics-ai sempre é WARNING
  if (layer === 'EXPERIMENTAL') {
    return 'WARNING'
  }
  
  // CORE_SAFE_LAYER nunca é CRITICAL
  if (layer === 'CORE_SAFE') {
    return 'WARNING'
  }
  
  // BLOCKING_LAYER: CRITICAL apenas se score >= 10
  if (layer === 'BLOCKING') {
    return riskScore >= 10 ? 'CRITICAL' : 'WARNING'
  }
  
  return 'WARNING'
}

function shouldIgnore(filePath: string): boolean {
  return IGNORED_DIRS.some(dir => filePath.includes(dir)) || 
         filePath.includes('.test.ts') || 
         filePath.includes('.test.tsx')
}

function isException(line: string): boolean {
  return EXCEPTION_PATTERNS.some(pattern => pattern.test(line))
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const layer = classifyLayer(filePath)

  lines.forEach((line, index) => {
    // Ignorar exceções
    if (isException(line)) {
      return
    }
    
    // Combinar todos os padrões para detecção
    const allPatterns = [...CRITICAL_PATTERNS, ...WARNING_PATTERNS]
    
    allPatterns.forEach(({ pattern }) => {
      if (pattern.test(line)) {
        const riskScore = calculateRiskScore(filePath, line)
        const severity = classifySeverity(filePath, line, riskScore, layer)
        
        findings.push({
          file: path.relative(ROOT_DIR, filePath),
          line: index + 1,
          content: line.trim(),
          severity,
          layer,
          riskScore,
        })
      }
    })
  })
}

function walk(dir: string) {
  const entries = fs.readdirSync(dir)

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)

    if (shouldIgnore(fullPath)) continue

    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      walk(fullPath)
    } else {
      if (TARGET_EXTENSIONS.includes(path.extname(fullPath))) {
        scanFile(fullPath)
      }
    }
  }
}

console.log('🔎 Iniciando auditoria de Type Safety com novas regras...\n')

walk(ROOT_DIR)

if (findings.length === 0) {
  console.log('✅ Nenhum uso de ANY encontrado.')
  process.exit(0)
}

// Agrupar por severidade e camada
const grouped = findings.reduce((acc, f) => {
  const key = `${f.severity}_${f.layer}`
  acc[key] = (acc[key] || 0) + 1
  return acc
}, {} as Record<string, number>)

// Separar por severidade
const criticalFindings = findings.filter(f => f.severity === 'CRITICAL')
const warningFindings = findings.filter(f => f.severity === 'WARNING')

console.log(`❌ Foram encontrados ${findings.length} usos de ANY:\n`)

// Mostrar CRITICAL primeiro
if (criticalFindings.length > 0) {
  console.log('🚨 OCORRÊNCIAS CRITICAL (Bloqueiam Build):')
  criticalFindings.forEach(f => {
    console.log(
      `🚨 [${f.severity}] [${f.layer}] Score:${f.riskScore} ${f.file}:${f.line}\n   → ${f.content}\n`
    )
  })
}

// Mostrar WARNING
if (warningFindings.length > 0) {
  console.log('⚠️ OCORRÊNCIAS WARNING (Não bloqueiam):')
  warningFindings.forEach(f => {
    console.log(
      `⚠️ [${f.severity}] [${f.layer}] Score:${f.riskScore} ${f.file}:${f.line}\n   → ${f.content}\n`
    )
  })
}

console.log('-------------------------------------')
console.log(`TOTAL: ${findings.length} ocorrências`)
console.log('Resumo por severidade/camada:', grouped)

// Bloquear apenas se houver CRITICAL em BLOCKING_LAYER
const blockingCritical = criticalFindings.filter(f => f.layer === 'BLOCKING')
if (blockingCritical.length > 0) {
  console.log(`\n🚨 ${blockingCritical.length} ocorrências CRITICAL em BLOCKING_LAYER - BLOQUEANDO BUILD`)
  process.exit(1)
}

console.log('\n✅ Sem ocorrências CRITICAL em BLOCKING_LAYER - Build liberado')
process.exit(0)
