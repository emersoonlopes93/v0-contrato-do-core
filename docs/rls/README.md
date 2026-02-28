# RLS — Row Level Security (Shadow)

- Geração de SQL: `npm run rls:generate` (saida: `prisma/rls/generated-rls.sql`)
- Aplicação em shadow: `psql $SHADOW_DATABASE_URL -f prisma/rls/generated-rls.sql`
- Necessário definir `app.tenant_id` por conexão:
  - Em shadow, usar transações por requisição e `SET LOCAL` dentro da transação.
  - Em produção, adotar transação por request ou conexão dedicada que preserve sessão.

Exemplo de sessão:

```
BEGIN;
SELECT set_config('app.tenant_id', '<TENANT_ID>', true);
-- queries
COMMIT;
```

Políticas criadas:
- SELECT: `tenant_id = current_setting('app.tenant_id', true)`
- INSERT/UPDATE/DELETE: checagem equivalente

Ordem sugerida:
1. Geração do SQL e aplicação no shadow
2. Testes de regressão e isolamento
3. Adaptação do runtime para definir `app.tenant_id` por request
4. Aplicação em produção
