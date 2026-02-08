import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const allowedExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const baseRefEnv = process.env.LINT_BASE_REF || process.env.GITHUB_BASE_REF || process.env.CI_BASE_REF;

const runGit = (command) => {
  return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
};

const resolveBaseRef = () => {
  if (baseRefEnv) return baseRefEnv;
  try {
    runGit('git show-ref --verify --quiet refs/remotes/origin/main');
    return 'origin/main';
  } catch {
    try {
      runGit('git show-ref --verify --quiet refs/heads/main');
      return 'main';
    } catch {
      return 'HEAD~1';
    }
  }
};

const baseRef = resolveBaseRef();
let diffBase = baseRef;
let changedFilesRaw = '';

try {
  diffBase = runGit(`git merge-base ${baseRef} HEAD`);
  changedFilesRaw = runGit(`git diff --name-only --diff-filter=ACMRTUXB ${diffBase}...HEAD`);
} catch {
  const fallback = process.env.LINT_CHANGED_FILES || process.env.CHANGED_FILES;
  if (fallback) {
    changedFilesRaw = fallback;
  } else {
    console.error('lint:changed não conseguiu acessar o git e não encontrou LINT_CHANGED_FILES.');
    process.exit(1);
  }
}
const normalizedChangedFilesRaw = changedFilesRaw.replace(/,/g, '\n');

const changedFiles = normalizedChangedFilesRaw
  ? normalizedChangedFilesRaw
      .split('\n')
      .map((file) => file.trim())
      .filter((file) => file.length > 0)
  : [];

const filesToLint = changedFiles
  .filter((file) => !file.includes('node_modules/'))
  .filter((file) => !file.includes('android/app/build/'))
  .filter((file) => {
    const ext = file.slice(file.lastIndexOf('.'));
    return allowedExtensions.has(ext);
  })
  .filter((file) => existsSync(resolve(process.cwd(), file)));

if (filesToLint.length === 0) {
  console.log('lint:changed sem arquivos elegíveis. Nenhuma ação necessária.');
  process.exit(0);
}

const args = ['npx', 'eslint', '--max-warnings=0', ...filesToLint];
console.log(`lint:changed analisando ${filesToLint.length} arquivo(s).`);
execSync(args.join(' '), { stdio: 'inherit' });
