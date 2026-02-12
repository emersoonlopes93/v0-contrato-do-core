# DOCUMENTO OFICIAL — EXCEÇÕES APROVADAS  
## SPRINT 7 — CARDÁPIO + DESIGNER

Este documento formaliza que o **Sprint 7** está **funcionalmente aprovado**, com **exceções arquiteturais registradas**, conforme validação realizada **sem refatoração** e **sem alterações no funcionamento em produção**.

---

## 1. MANIFESTS PARCIAIS

### Constatação

- `menu-online` **não contém**:
  - `scope`
  - `type`
  - `mobileFirst`
  - `canDisable`
- `designer-menu` possui `scope: 'public-menu'`

### Decisão

Manter como está.  
Padronização futura será tratada no **Sprint 10 (Hardening)**.

---

## 2. ESTRUTURA DE PASTAS

### Constatação

- `menu-online` não possui `ui/` e `hooks/` internos.
- `types` estão centralizados em `src/types`.

### Decisão

Arquitetura atual é válida.  
Sem refatoração neste momento.

---

## 3. PÁGINAS EM `src/tenant/pages`

### Constatação

Existem páginas fora do diretório do módulo.

### Decisão

Padrão atual do projeto.  
Não será alterado neste sprint.

---

## 4. INTEGRAÇÃO DESIGNER → PÚBLICO VIA `localStorage`

### Constatação

Comunicação ocorre via:

- `localStorage`
- evento custom: `designer-menu-updated`

Não há separação formal de **draft/publicado**.

### Decisão

Aceito como decisão de UX local.  
Sem impacto estrutural.  
Refatoração opcional no **Sprint 10**.

---

# STATUS FINAL

**Sprint 7 — APROVADO COM EXCEÇÕES DOCUMENTADAS**

- **Sem risco estrutural.**
- **Sem risco de corrupção de dados.**
- **Sem impacto no white-label.**
- **Sem alteração aplicada.**
