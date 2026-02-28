import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Model = {
  name: string;
  body: string;
  hasTenantId: boolean;
  tenantIdOptional: boolean;
  uniques: string[][];
};

function extractTenantTables(ts: string): string[] {
  const m = ts.match(/export\s+const\s+TENANT_TABLES\s*=\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  const list = m[1];
  const items = Array.from(list.matchAll(/['"`]([\w]+)['"`]/g)).map((x) => x[1]);
  return items;
}

function splitModels(schema: string): Model[] {
  const models: Model[] = [];
  const re = /model\s+(\w+)\s*\{([\s\S]*?)^\}/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(schema)) !== null) {
    const name = m[1];
    const body = m[2];
    const hasTenantId = /tenant_id\s+\w+\??/.test(body);
    const tenantIdOptional = /tenant_id\s+\w+\?/.test(body);
    const uniques: string[][] = [];
    const u = body.matchAll(/@@unique\s*\(\s*\[([^\]]+)\]\s*\)/g);
    for (const um of u) {
      const fields = um[1].split(',').map((s) => s.trim()).filter(Boolean);
      uniques.push(fields);
    }
    models.push({ name, body, hasTenantId, tenantIdOptional, uniques });
  }
  return models;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirnameLocal = path.dirname(__filename);
  const projectRoot = path.resolve(__dirnameLocal, '..');
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  const tenantMiddlewarePath = path.join(projectRoot, 'src', 'adapters', 'prisma', 'tenant-middleware.ts');
  const [schema, tenantTs] = await Promise.all([fs.readFile(schemaPath, 'utf8'), fs.readFile(tenantMiddlewarePath, 'utf8')]);

  const tenantTables = new Set(extractTenantTables(tenantTs));
  const models = splitModels(schema);
  const modelsByName = new Map(models.map((m) => [m.name, m]));

  const violations: string[] = [];

  const OPTIONAL_TENANT_ID = new Set(['AuditEvent']);
  for (const t of tenantTables) {
    const m = modelsByName.get(t);
    if (!m) {
      violations.push(`TENANT_TABLES includes '${t}' but model not found`);
      continue;
    }
    if (!m.hasTenantId) {
      violations.push(`Model '${t}' missing tenant_id`);
    } else if (m.tenantIdOptional && !OPTIONAL_TENANT_ID.has(t)) {
      violations.push(`Model '${t}' tenant_id is optional`);
    }
  }

  for (const m of models) {
    if (m.hasTenantId && !m.tenantIdOptional && !tenantTables.has(m.name)) {
      violations.push(`Model '${m.name}' has tenant_id but is not listed in TENANT_TABLES`);
    }
  }

  for (const m of models) {
    if (!m.hasTenantId || m.tenantIdOptional) continue;
    for (const u of m.uniques) {
      const fields = u.map((f) => f.replace(/@@?/, ''));
      if (fields.length === 1 && fields[0] === 'id') continue;
      if (!fields.includes('tenant_id')) {
        violations.push(`Model '${m.name}' @@unique([${fields.join(', ')}]) missing tenant_id`);
      }
    }
  }

  if (violations.length > 0) {
    console.error('Tenant schema violations:');
    for (const v of violations) console.error('- ' + v);
    process.exit(1);
  } else {
    console.log('Tenant schema checks passed');
    process.exit(0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
