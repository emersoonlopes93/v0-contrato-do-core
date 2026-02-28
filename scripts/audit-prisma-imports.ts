import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Violation = {
  file: string;
  line: number;
  content: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirnameLocal = path.dirname(__filename);
const projectRoot = path.resolve(__dirnameLocal, '..');
const srcDir = path.join(projectRoot, 'src');
const allowedPrefixes = [
  path.join(srcDir, 'adapters', 'prisma') + path.sep,
];
const allowedDirs = [
  path.join(projectRoot, 'prisma') + path.sep,
];

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      files.push(...await listFiles(full));
    } else if (entry.isFile()) {
      if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js')) {
        files.push(full);
      }
    }
  }
  return files;
}

function isAllowedFile(file: string): boolean {
  if (allowedDirs.some((p) => file.startsWith(p))) return true;
  if (allowedPrefixes.some((p) => file.startsWith(p))) return true;
  return false;
}

async function scan(): Promise<number> {
  const files = [
    ...(await listFiles(srcDir)),
    ...(await listFiles(path.join(projectRoot, 'prisma'))),
  ];
  const violations: Violation[] = [];

  const importRe = /\bimport\s+{[^}]*PrismaClient[^}]*}\s+from\s+['"]@prisma\/client['"]/;
  const newRe = /\bnew\s+PrismaClient\b/;
  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');
    if (isAllowedFile(file)) continue;
    const lines = text.split(/\r?\n/);
    lines.forEach((l, i) => {
      if (importRe.test(l) || newRe.test(l)) {
        violations.push({ file, line: i + 1, content: l.trim() });
      }
    });
  }

  if (violations.length > 0) {
    const msgs = violations.map(v => `${v.file}:${v.line} -> ${v.content}`).join('\n');
    console.error('PrismaClient import violations detected:\n' + msgs);
    return 1;
  }
  return 0;
}

scan().then((code) => {
  process.exit(code);
}).catch((err) => {
  console.error(err);
  process.exit(2);
});
