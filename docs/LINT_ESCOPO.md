Lint por escopo de mudança

Objetivo
Executar lint apenas nos arquivos alterados na task atual, mantendo o lint global intacto.

Comandos
- npm run lint:changed
- npm run lint

Uso em CI
- Defina LINT_BASE_REF com a referência base (ex.: origin/main)
- Rode npm run lint:changed para bloquear apenas regressões no escopo atual

Observações
- O lint global permanece disponível para auditoria completa.
- O lint por escopo falha se qualquer arquivo alterado violar regras.
