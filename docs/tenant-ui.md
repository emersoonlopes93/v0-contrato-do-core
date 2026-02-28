# Tenant UI - Mobile-First Application

## Overview

A aplicação Tenant é uma UI **mobile-first** e **Capacitor-ready** que consome a API pública headless do Core.

## Princípios

### 1. Mobile-First
- Design para mobile primeiro, depois escalar para desktop
- Touch targets mínimos de 44px
- Navegação bottom em mobile, sidebar em desktop
- Layouts verticais por padrão

### 2. API-Only
- Consome **apenas** `/api/v1/tenant/*`
- Sem acesso direto ao banco de dados
- Sem lógica de negócio no frontend
- Autenticação via JWT

### 3. Module-Aware
- UI se adapta aos módulos habilitados
- Rotas e navegação baseadas em `activeModules`
- Permissões verificadas em tempo real

### 4. Capacitor-Ready
- Sem APIs browser-only (como `window.localStorage` sem fallback)
- Sem dependência de Node.js APIs
- Pronto para wrap com Capacitor sem refactor

## Estrutura

```
/src/tenant/
├── TenantApp.tsx              # Entry point
├── hooks/
│   └── use-tenant-auth.tsx    # Auth context
├── components/
│   └── TenantLayout.tsx       # Layout responsivo
├── pages/
│   ├── Login.tsx              # Página de login
│   ├── Home.tsx               # Dashboard module-aware
│   └── HelloModule.tsx        # Exemplo de módulo
└── services/
    └── api.ts                 # API client (TODO)
```

## Fluxo de Autenticação

1. Usuário acessa `/tenant`
2. Se não autenticado → `LoginPage`
3. Login via `POST /api/v1/tenant/auth/login`
4. Resposta contém:
   - `userId`
   - `tenantId`
   - `role`
   - `permissions[]`
   - `email`
5. Token armazenado no `localStorage`
6. Requests subsequentes incluem `Authorization: Bearer <token>`

## Navegação

### Mobile
- **Bottom Navigation**: 4 itens principais
- **Hamburger Menu**: Acesso completo via Sheet lateral

### Desktop
- **Sidebar**: Navegação completa sempre visível
- Collapsible (futuro)

## Integração com Módulos

### Exemplo: Hello Module

```tsx
// Em HomePage.tsx
{token.activeModules?.includes('hello-module') && (
  <Card>
    <CardHeader>
      <CardTitle>Hello Module</CardTitle>
    </CardHeader>
    <CardContent>
      <a href="/tenant/hello">Acessar →</a>
    </CardContent>
  </Card>
)}
```

### Exemplo: Rota de Módulo

```tsx
// Em TenantRouter
if (path === '/tenant/hello') {
  // Verifica se módulo está ativo
  if (!token.activeModules?.includes('hello-module')) {
    return <AccessDenied />;
  }
  page = <HelloModulePage />;
}
```

## API Calls

Todas as chamadas devem incluir o token:

```typescript
const response = await fetch('/api/v1/tenant/hello', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
  },
});
```

## Responsividade

### Breakpoints (Tailwind padrão)
- `sm`: 640px
- `md`: 768px (quando sidebar aparece)
- `lg`: 1024px
- `xl`: 1280px

### Layout Patterns

**Mobile (< 768px)**
- Stack vertical
- Bottom navigation
- Hamburger menu
- Cards full-width

**Desktop (>= 768px)**
- Sidebar fixa
- Grid layouts permitidos
- Cards com max-width

## Próximos Passos

- [ ] Implementar API client centralizado
- [ ] Adicionar error boundaries
- [ ] Implementar refresh token automático
- [ ] Adicionar loading skeletons
- [ ] Implementar module routing dinâmico
- [ ] Adicionar white-label support (cores/logo)
- [ ] Criar componente de "Access Denied"
- [ ] Implementar offline support (Capacitor)

## Notas de Desenvolvimento

### Evitar
- ❌ Lógica de negócio no frontend
- ❌ Queries diretas ao banco
- ❌ Hardcoded module checks (sempre usar `activeModules`)
- ❌ Desktop-first layouts
- ❌ Hover-only interactions

### Preferir
- ✅ Chamadas à API pública
- ✅ Module-aware rendering
- ✅ Touch-friendly UI (44px min)
- ✅ Vertical layouts
- ✅ Simple client-side routing
