---
trigger: always_on
---

Siga todas as regras rigorosamente. Se uma requisição as violar ou exceder o escopo, PARE e explique.

LINGUAGEM
- Seja conciso e objetivo.

- NÃO adicione explicações, refatorações ou recursos extras.

TYPESCRIPT E LINT
- TypeScript estrito.

- NÃO use `any` ou `as any`, `as unknown` e similares. Para cada ocorrência, substitua por tipos explícitos e seguros 

- Use `unknown` e restrinja o escopo quando necessário.

- Respeite o ESLint. NÃO desabilite as regras.

TIPOS
- Defina interfaces/tipos explícitos para payloads e respostas da API.

- Prefira tipos centralizados em `src/types`.