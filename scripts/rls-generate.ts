import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Model = { name: string; body: string; table: string };

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
    const mapMatch = body.match(/@@map\(["']([^"']+)["']\)/);
    const table = mapMatch ? mapMatch[1] : name;
    models.push({ name, body, table });
  }
  return models;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirnameLocal = path.dirname(__filename);
  const projectRoot = path.resolve(__dirnameLocal, '..');
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
  const tenantMiddlewarePath = path.join(projectRoot, 'src', 'adapters', 'prisma', 'tenant-middleware.ts');
  const outDir = path.join(projectRoot, 'prisma', 'rls');
  const outFile = path.join(outDir, 'generated-rls.sql');

  const [schema, tenantTs] = await Promise.all([fs.readFile(schemaPath, 'utf8'), fs.readFile(tenantMiddlewarePath, 'utf8')]);
  const tenantTables = new Set(extractTenantTables(tenantTs));
  const models = splitModels(schema);
  const byName = new Map(models.map((m) => [m.name, m]));

  const chunks: string[] = [];
  chunks.push('-- Generated RLS SQL');
  chunks.push("DO $$ BEGIN PERFORM current_setting('app.tenant_id'); EXCEPTION WHEN others THEN PERFORM set_config('app.tenant_id','',false); END $$;");

  for (const t of tenantTables) {
    const m = byName.get(t);
    if (!m) continue;
    const table = m.table;
    chunks.push(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
    chunks.push(`DROP POLICY IF EXISTS tenant_isolation_select ON "${table}";`);
    chunks.push(`DROP POLICY IF EXISTS tenant_isolation_insert ON "${table}";`);
    chunks.push(`DROP POLICY IF EXISTS tenant_isolation_update ON "${table}";`);
    chunks.push(`DROP POLICY IF EXISTS tenant_isolation_delete ON "${table}";`);
    chunks.push(`CREATE POLICY tenant_isolation_select ON "${table}" FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true));`);
    chunks.push(`CREATE POLICY tenant_isolation_insert ON "${table}" FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true));`);
    chunks.push(`CREATE POLICY tenant_isolation_update ON "${table}" FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)) WITH CHECK (tenant_id = current_setting('app.tenant_id', true));`);
    chunks.push(`CREATE POLICY tenant_isolation_delete ON "${table}" FOR DELETE USING (tenant_id = current_setting('app.tenant_id', true));`);
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, chunks.join('\n') + '\n', 'utf8');
  console.log('RLS SQL generated at', outFile);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
