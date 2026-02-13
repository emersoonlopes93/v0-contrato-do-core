import { Prisma, PrismaClient } from '@prisma/client';
import { getTenantId } from '@/src/core/context/async-context';
import { TENANT_TABLES } from './tenant-middleware';

export function withTenantProxy(client: PrismaClient) {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantId = getTenantId();

          // Se não há tenantId no contexto ou o model não é tenant-scoped, segue normal
          if (!tenantId || !model || !TENANT_TABLES.includes(model)) {
            return query(args);
          }

          // Injeta tenant_id em operações de leitura/escrita
          if (operation === 'findMany' || operation === 'findFirst' || operation === 'count') {
             // @ts-expect-error args.where is possibly undefined
            args.where = { ...args.where, tenant_id: tenantId };
          }
          
          // Transforma findUnique em findFirst para garantir filtro de tenant
          if (operation === 'findUnique') {
             // @ts-expect-error args.where is possibly undefined
             const where = { ...args.where, tenant_id: tenantId };
             // @ts-expect-error query expects findUnique args but we are changing to findFirst logic effectively
             // Actually, extending findUnique is restrictive. 
             // We'll proceed with the original query but with injected where if possible,
             // or delegate to findFirst if findUnique doesn't support the compound.
             // But simplest for now is attempting to inject. 
             // If schema doesn't support tenant_id in findUnique where, this might fail at runtime or type check.
             // Safe bet: use findFirst logic.
             // But we can't easily change the operation type in extension query.
             // We can only modify args.
             
             // If we can't add tenant_id to findUnique where clause (because it's not part of unique key),
             // we should theoretically fail or switch to findFirst.
             // Let's try injecting. If it fails, we might need a model-specific approach.
             // However, for standard "Hardening", we assume we want to restrict.
             
             // NOTE: Changing findUnique to findFirst is not directly supported in query extension signature easily without casting.
             // Let's try injecting tenant_id. If the unique index is (id, tenant_id), it works.
             // If it's just (id), adding tenant_id might be invalid for findUnique.
             
             // Strategy:
             // Use `findFirst` instead of `findUnique` when tenant_id is enforced.
             // But we are inside `findUnique` hook.
             // We can call `client[model].findFirst`? No, circular dependency potential.
             
             // Let's trust that we can add tenant_id to where. 
             // If not, we might rely on the fact that IDs are UUIDs.
             // But to be strictly "Hardened", we need to check tenant_id.
             
             // Alternative: Post-read check.
             // const result = await query(args);
             // if (result && result.tenant_id !== tenantId) return null;
             // return result;
             
             const result = await query(args);
             if (result && typeof result === 'object' && 'tenant_id' in result) {
               if ((result as any).tenant_id !== tenantId) {
                 return null; // Oculta dado de outro tenant
               }
             }
             return result;
          }

          if (operation === 'update' || operation === 'delete') {
             // @ts-expect-error args.where is possibly undefined
            args.where = { ...args.where, tenant_id: tenantId };
          }

          if (operation === 'updateMany' || operation === 'deleteMany') {
             // @ts-expect-error args.where is possibly undefined
            args.where = { ...args.where, tenant_id: tenantId };
          }

          if (operation === 'create') {
            // @ts-expect-error args.data is possibly undefined
            args.data = { ...args.data, tenant_id: tenantId };
          }

          if (operation === 'createMany') {
            // @ts-expect-error args.data is possibly undefined
            if (Array.isArray(args.data)) {
               // @ts-expect-error args.data is array
              args.data = args.data.map((item: any) => ({ ...item, tenant_id: tenantId }));
            } else {
               // @ts-expect-error args.data is object
              args.data = { ...args.data, tenant_id: tenantId };
            }
          }
          
          if (operation === 'upsert') {
             // @ts-expect-error args.where is possibly undefined
             args.where = { ...args.where, tenant_id: tenantId };
             // @ts-expect-error args.create is possibly undefined
             args.create = { ...args.create, tenant_id: tenantId };
             // update part implies finding it first, which is covered by where.
          }

          return query(args);
        },
      },
    },
  });
}
