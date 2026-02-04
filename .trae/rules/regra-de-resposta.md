---
alwaysApply: true
---
Follow all rules strictly. If a request violates them or exceeds scope, STOP and explain.

LANGUAGE
- Be concise and objective.
- Do NOT add explanations, refactors, or extra features.

TYPESCRIPT & LINT
- Strict TypeScript.
- Do NOT use `any` or `as any`.
- Use `unknown` and narrow when needed.
- Respect ESLint. Do NOT disable rules.

TYPES
- Define explicit interfaces/types for API payloads and responses.
- Prefer centralized types in `src/types`.
- Do NOT use inline interfaces in controllers/components.
- Do NOT reuse entities as DTOs.
IMPORTS & STRUCTURE
- Always use `@/*` alias for internal imports.
- Do NOT replace with relative paths.
- Do NOT move files or folders unless instructed.

ARCHITECTURE
- Controllers must be thin.
- Business logic in Services.
- Data access isolated (Prisma/Repo).
- Do NOT refactor unrelated code.

SCOPE
- Implement ONLY what is requested.
- If scope must expand: STOP and ask.
Breaking any rule = invalid output.
