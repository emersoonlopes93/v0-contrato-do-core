# Layout Base Premium - Tenant App

## Visão Geral

Sistema de layout premium, mobile-first e profissional para o Tenant App. Criado seguindo o **Contrato do Core** e sem alterar lógica de negócio existente.

## Componentes

### 1. TenantLayout

Componente principal que orquestra todo o layout.

```tsx
import { TenantLayout } from '@/src/tenant/components/TenantLayout';

export default function MinhaPage() {
  return (
    <TenantLayout 
      pageTitle="Dashboard"
      headerActions={
        <>
          <Button>Nova Ação</Button>
        </>
      }
    >
      <div>Seu conteúdo aqui</div>
    </TenantLayout>
  );
}
```

**Props:**
- `children` (obrigatório): Conteúdo da página
- `pageTitle` (opcional): Título exibido no header
- `headerActions` (opcional): Botões de ação no header desktop
- `showBackButton` (opcional): Mostra botão voltar
- `onBack` (opcional): Callback ao clicar em voltar

### 2. TenantHeader

Header institucional com branding do tenant.

**Exibe:**
1. Nome do SaaS (Pedidos Online)
2. Logo/Nome do Restaurante
3. Status da Loja (Aberta/Fechada)
4. Link do Cardápio Público

**Hierarquia Visual:**
```
┌─────────────────────────────┐
│ PEDIDOS ONLINE             │ ← Nome do SaaS
├─────────────────────────────┤
│ 🏪 Restaurante ABC         │ ← Logo/Nome
│ 🟢 Loja Aberta             │ ← Status
│ [Ver Cardápio Público] →   │ ← Link
└─────────────────────────────┘
```

### 3. TenantSidebar

Menu de navegação com módulos habilitados.

**Recursos:**
- Destaque visual para rota ativa
- Hover states elegantes
- Transições suaves (200ms)
- Ícones animados no hover
- Scroll interno se necessário

### 4. TenantFooter

Rodapé com informações do usuário.

**Exibe:**
- Avatar com inicial do nome
- Nome do usuário
- Cargo (RBAC)
- Botão de logout

### 5. DesktopHeader

Header no topo da área de conteúdo (apenas desktop).

**Exibe:**
- Título da página
- Botão voltar (opcional)
- Ações contextuais

## Comportamento Mobile vs Desktop

### Mobile
- Sidebar vira Drawer (slide from left)
- Header fixo no topo com botão menu
- Conteúdo 100% largura
- Transição suave 300ms

### Desktop
- Sidebar fixa (288px = w-72)
- Header desktop com título e ações
- Layout em grid otimizado
- Mais densidade visual

## Design Premium

### Cores e Status

**Status da Loja:**
- Aberta: Verde (`green-500/10` background, `green-700` texto)
- Fechada: Vermelho (`red-500/10` background, `red-700` texto)

**Menu de Navegação:**
- Ativo: `bg-primary text-primary-foreground`
- Hover: `hover:bg-accent/80 hover:text-foreground`
- Transição: `duration-200 ease-in-out`

### Transições

Todas as transições seguem o padrão premium:
- Duração: 150-200ms
- Easing: `ease-in-out`
- Propriedades: `all` ou específicas

```css
transition-all duration-200 ease-in-out
```

### Espaçamentos

Escala consistente usando Tailwind:
- Pequeno: `gap-1.5`, `p-2`, `py-2.5`
- Médio: `gap-3`, `p-4`, `px-4`
- Grande: `gap-4`, `p-6`, `px-6`

### Tipografia

**Hierarquia clara:**
- SaaS Name: `text-[10px] font-bold uppercase tracking-widest`
- Títulos: `text-lg font-semibold tracking-tight`
- Labels: `text-sm font-medium`
- Descrições: `text-xs text-muted-foreground`

### Efeitos Visuais

**Gradientes sutis:**
```tsx
bg-gradient-to-b from-background to-muted/20
bg-gradient-to-t from-muted/20 to-background
bg-gradient-to-br from-background via-muted/5 to-background
```

**Backdrop blur:**
```tsx
backdrop-blur supports-[backdrop-filter]:bg-background/60
```

**Shadows:**
```tsx
shadow-sm  // Sidebar e headers
```

## Exemplos de Uso

### Página Simples

```tsx
import { TenantLayout } from '@/src/tenant/components/TenantLayout';

export default function Dashboard() {
  return (
    <TenantLayout pageTitle="Dashboard">
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Bem-vindo!</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Cards com métricas */}
        </div>
      </div>
    </TenantLayout>
  );
}
```

### Página com Ações

```tsx
import { TenantLayout } from '@/src/tenant/components/TenantLayout';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';

export default function Pedidos() {
  return (
    <TenantLayout 
      pageTitle="Pedidos"
      headerActions={
        <>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Pedido
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Lista de pedidos */}
      </div>
    </TenantLayout>
  );
}
```

### Página com Navegação

```tsx
import { TenantLayout } from '@/src/tenant/components/TenantLayout';
import { useRouter } from 'next/navigation';

export default function PedidoDetalhes() {
  const router = useRouter();
  
  return (
    <TenantLayout 
      pageTitle="Pedido #1234"
      showBackButton
      onBack={() => router.back()}
    >
      <div className="space-y-6">
        {/* Detalhes do pedido */}
      </div>
    </TenantLayout>
  );
}
```

## Acessibilidade

- Contraste mínimo WCAG AA
- Focus visible em todos os elementos interativos
- Navegação por teclado
- Semântica HTML correta
- ARIA labels onde necessário

## Performance

- Zero JavaScript desnecessário
- CSS otimizado com Tailwind
- Transições apenas em propriedades específicas
- Scroll suave nativo

## Responsividade

Breakpoints Tailwind:
- Mobile: `< 768px`
- Desktop: `>= 768px` (md)

## Extensibilidade

O layout aceita qualquer conteúdo como children sem impor estrutura específica. Cada módulo define sua própria interface interna.

## Contrato do Core

Este layout **NÃO**:
- ❌ Altera backend
- ❌ Altera auth/session
- ❌ Altera regras de negócio
- ❌ Quebra contratos existentes

Este layout **APENAS**:
- ✅ Melhora visual e UX
- ✅ Mantém estrutura existente
- ✅ Respeita módulos e permissões
- ✅ Adiciona camada de apresentação

## Migração

Para migrar páginas antigas:

**Antes:**
```tsx
export default function MinhaPage() {
  return (
    <div className="p-4">
      {/* Conteúdo */}
    </div>
  );
}
```

**Depois:**
```tsx
import { TenantLayout } from '@/src/tenant/components/TenantLayout';

export default function MinhaPage() {
  return (
    <TenantLayout pageTitle="Minha Página">
      {/* Conteúdo */}
    </TenantLayout>
  );
}
```

## Arquivos do Sistema

```
/src/tenant/components/
├── TenantLayout.tsx          # Layout principal
├── TenantHeader.tsx          # Header institucional
├── TenantSidebar.tsx         # Menu de navegação
├── TenantFooter.tsx          # Rodapé com usuário
├── DesktopHeader.tsx         # Header desktop
└── LAYOUT_PREMIUM.md         # Esta documentação
```

## Conclusão

Layout base premium pronto para produção, seguindo as melhores práticas de design, acessibilidade e performance. Zero breaking changes, 100% compatível com o sistema existente.
