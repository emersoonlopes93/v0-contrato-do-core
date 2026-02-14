import type { PrismaClient } from '@prisma/client';
import { getTenantId } from '@/src/core/context/async-context';
import { isRecord } from '@/src/core/utils/type-guards';
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
            args.where = { ...args.where, tenant_id: tenantId };
          }
          
          // Transforma findUnique em findFirst para garantir filtro de tenant
          if (operation === 'findUnique') {
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
            if (isRecord(result) && 'tenant_id' in result) {
              const resultTenantId = result.tenant_id;
              if (typeof resultTenantId === 'string' && resultTenantId !== tenantId) {
                return null; // Oculta dado de outro tenant
              }
            }
            return result;
          }

          if (operation === 'update' || operation === 'delete') {
            args.where = { ...args.where, tenant_id: tenantId };
          }

          if (operation === 'updateMany' || operation === 'deleteMany') {
            args.where = { ...args.where, tenant_id: tenantId };
          }

          if (operation === 'create') {
            if (isRecord(args.data)) {
              const nextArgs = {
                ...args,
                data: { ...args.data, tenant_id: tenantId },
              } as typeof args;
              return query(nextArgs);
            }
          }

          if (operation === 'createMany') {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((item) =>
                isRecord(item) ? { ...item, tenant_id: tenantId } : item
              );
            } else if (isRecord(args.data)) {
              args.data = { ...args.data, tenant_id: tenantId };
            }
          }
          
          if (operation === 'upsert') {
             const nextArgs = {
               ...args,
               where: { ...args.where, tenant_id: tenantId },
               create: isRecord(args.create) ? { ...args.create, tenant_id: tenantId } : args.create,
             } as typeof args;
             return query(nextArgs);
          }

          return query(args);
        },
      },
    },
  });
}
