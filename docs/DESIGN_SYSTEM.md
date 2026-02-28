# DESIGN SYSTEM SAAS

Design System profissional e consistente para aplicação SaaS multi-tenant.

---

## FILOSOFIA

- **Mobile-First**: Design pensado primeiro para mobile, expandindo para desktop
- **Consistência Visual**: Tokens centralizados, sem valores hardcoded
- **Premium sem Exagero**: Profissional, confiável, vendável
- **Acessibilidade**: Contraste AA, touch targets adequados, sem dependência exclusiva de cor

---

## PALETA DE CORES

### Cores Primárias

```css
--primary: 217 91% 60%          /* Azul SaaS profissional */
--primary-foreground: 0 0% 100% /* Texto em primary */
--primary-hover: 217 91% 54%    /* Hover state */
--primary-active: 217 91% 48%   /* Active state */
--primary-soft: 217 91% 97%     /* Backgrounds suaves */
```

**Uso**: Botões principais, links, indicadores de foco

### Cores Neutras

```css
--background: 0 0% 100%         /* Fundo da aplicação */
--foreground: 222 47% 11%       /* Texto principal */

--background-app: 0 0% 99%      /* Fundo geral */
--background-surface: 0 0% 100% /* Surfaces/cards */
--background-card: 0 0% 100%    /* Cards específicos */

--border: 214 32% 91%           /* Bordas padrão */
--border-soft: 214 20% 95%      /* Bordas suaves */
```

**Uso**: Layout, backgrounds, separadores

### Cores de Status

```css
/* Sucesso */
--success: 142 76% 36%          /* Verde: loja aberta, pedido entregue */
--success-foreground: 0 0% 100%
--success-soft: 142 76% 96%

/* Warning */
--warning: 38 92% 50%           /* Amarelo: atenção, atraso */
--warning-foreground: 0 0% 100%
--warning-soft: 38 92% 96%

/* Danger */
--danger: 0 84% 60%             /* Vermelho: loja fechada, cancelado */
--danger-foreground: 0 0% 100%
--danger-soft: 0 84% 97%

/* Info */
--info: 199 89% 48%             /* Azul: informações */
--info-foreground: 0 0% 100%
--info-soft: 199 89% 96%
```

**Uso**: Badges, alertas, feedback visual

### Cores de Texto

```css
--text-primary: 222 47% 11%     /* Títulos e textos principais */
--text-secondary: 215 16% 47%   /* Textos secundários */
--text-muted: 215 14% 65%       /* Textos discretos */
--text-inverse: 0 0% 100%       /* Texto em backgrounds escuros */
```

---

## TIPOGRAFIA

### Fonte

**Inter** - Fonte moderna, alta legibilidade, otimizada para telas

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
```

### Escala Tipográfica

| Classe | Tamanho | Line Height | Uso |
|--------|---------|-------------|-----|
| `text-xs` | 12px | 16px | Labels pequenos, metadados |
| `text-sm` | 14px | 20px | **Texto base mobile**, cards compactos |
| `text-base` | 16px | 24px | **Texto padrão desktop**, parágrafos |
| `text-lg` | 18px | 28px | Subtítulos, destaque moderado |
| `text-xl` | 20px | 28px | Títulos de seções |
| `text-2xl` | 24px | 32px | Títulos principais |
| `text-3xl` | 30px | 36px | Headers importantes |

### Pesos

| Classe | Peso | Uso |
|--------|------|-----|
| `font-normal` | 400 | Texto corrido |
| `font-medium` | 500 | Destaque leve, labels |
| `font-semibold` | 600 | Subtítulos, CTA secundário |
| `font-bold` | 700 | Títulos, CTA principal |

### Boas Práticas

- **Mobile**: Priorizar `text-sm` e `text-base`
- **Desktop**: Pode usar `text-lg+` mas com moderação
- **Hierarquia**: Sempre usar peso antes de aumentar tamanho
- **Legibilidade**: `leading-relaxed` ou `leading-6` para textos longos

---

## ESPAÇAMENTOS

Sistema de Grid baseado em 4px.

| Token | Valor | Uso |
|-------|-------|-----|
| `spacing-1` | 4px | Gaps mínimos |
| `spacing-2` | 8px | Espaçamento interno compacto |
| `spacing-3` | 12px | Espaçamento padrão mobile |
| `spacing-4` | 16px | **Espaçamento padrão geral** |
| `spacing-5` | 20px | Espaçamento confortável |
| `spacing-6` | 24px | Seções, cards |
| `spacing-8` | 32px | Separação de blocos |

### Classes Tailwind

```tsx
// Padding
<div className="p-4">      {/* 16px */}
<div className="px-6 py-4"> {/* horizontal 24px, vertical 16px */}

// Margin
<div className="mt-6 mb-4"> {/* top 24px, bottom 16px */}

// Gap (preferível para flexbox/grid)
<div className="flex gap-4">      {/* 16px entre itens */}
<div className="grid gap-6">      {/* 24px entre itens */}
```

### Regras

- **Nunca** usar valores arbitrários (ex: `p-[13px]`)
- **Sempre** usar a escala definida
- **Mobile**: Preferir espaçamentos menores (3, 4)
- **Desktop**: Pode usar espaçamentos maiores (6, 8)

---

## BORDAS E ELEVAÇÃO

### Raios de Borda

```css
--radius-sm: 0.375rem  /* 6px - Botões, tags */
--radius-md: 0.5rem    /* 8px - Cards, inputs */
--radius-lg: 0.75rem   /* 12px - Modais, grandes containers */
```

**Classes Tailwind**: `rounded-sm`, `rounded-md`, `rounded-lg`

### Sombras

```css
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05)     /* Cards sutis */
--shadow-md: 0 4px 6px rgba(0,0,0,0.1)      /* Modais, dropdowns */
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1)    /* Overlays importantes */
```

**Classes Tailwind**: `shadow-sm`, `shadow-md`, `shadow-lg`

### Boas Práticas

- **Cards**: `rounded-md shadow-sm`
- **Modais**: `rounded-lg shadow-md`
- **Botões**: `rounded-sm` ou `rounded-md`
- **Não exagerar**: Layout base = `shadow-none`

---

## COMPONENTES BASE

### Botões

```tsx
// Primário
<Button className="bg-primary text-primary-foreground hover:bg-primary-hover">
  Confirmar
</Button>

// Secundário
<Button variant="outline">
  Cancelar
</Button>

// Danger
<Button variant="destructive">
  Excluir
</Button>
```

### Badges de Status

```tsx
// Sucesso
<Badge className="bg-success-soft text-success border-success/20">
  Aberta
</Badge>

// Warning
<Badge className="bg-warning-soft text-warning border-warning/20">
  Atenção
</Badge>

// Danger
<Badge className="bg-danger-soft text-danger border-danger/20">
  Fechada
</Badge>
```

### Cards

```tsx
<Card className="rounded-md shadow-sm border border-border">
  <CardHeader className="pb-3">
    <CardTitle className="text-lg font-semibold">Título</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">
      Descrição
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

### Inputs

```tsx
<Input 
  className="h-11 rounded-md border-border focus:ring-primary"
  placeholder="Digite aqui"
/>
```

---

## MOBILE-FIRST

### Touch Targets

Todos os elementos interativos têm altura mínima de 44px no mobile:

```css
button, [role="button"], a {
  @apply min-h-[44px] md:min-h-0;
}
```

### Responsividade

```tsx
// Mobile: texto menor, espaçamento compacto
<div className="text-sm p-3 md:text-base md:p-6">

// Desktop: mais espaço, mais densidade horizontal
<div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-6">
```

### Princípios

- **Mobile**: Leitura vertical, compacto, foco em funcionalidade
- **Desktop**: Mais respiro, melhor escaneabilidade, densidade horizontal

---

## DARK MODE

O sistema possui suporte completo a dark mode via classe `.dark`:

```tsx
<html className="dark">
```

Todas as cores são invertidas automaticamente via CSS variables.

---

## TRANSIÇÕES

### Duração Padrão

```tsx
// Transição suave (150ms)
<div className="transition-smooth hover:bg-accent">

// Transição suave (200ms)
<div className="transition-smooth-200 hover:scale-105">
```

### Boas Práticas

- **Hover**: 150ms
- **Animações**: 200ms
- **Sempre** usar `cubic-bezier(0.4, 0, 0.2, 1)` (já incluído)

---

## ACESSIBILIDADE

### Contraste

Todas as combinações de cores atendem ao padrão **WCAG AA** (mínimo 4.5:1).

### Estados de Foco

```tsx
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Acessível
</Button>
```

### Não Depender Apenas de Cor

```tsx
// ✅ Correto: ícone + cor
<Badge className="bg-success-soft text-success">
  <CheckCircle className="h-3 w-3 mr-1" />
  Ativo
</Badge>

// ❌ Incorreto: apenas cor
<div className="bg-success" />
```

---

## REGRAS DE OURO

### O que SEMPRE fazer

- Usar tokens (CSS variables)
- Mobile-first
- Consistência visual
- Acessibilidade AA

### O que NUNCA fazer

- Cores hardcoded (ex: `bg-blue-500`)
- Valores arbitrários (ex: `p-[13px]`)
- Exagero visual (gradientes complexos, sombras pesadas)
- Ignorar mobile

---

## EXEMPLO COMPLETO

```tsx
export function PedidoCard({ pedido }: { pedido: Order }) {
  return (
    <Card className="rounded-md shadow-sm border border-border transition-smooth hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            #{pedido.orderNumber}
          </CardTitle>
          <Badge className="bg-success-soft text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Entregue
          </Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          Pedido realizado há 2 horas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">R$ 45,90</span>
        </div>
        
        <Button className="w-full bg-primary text-primary-foreground hover:bg-primary-hover transition-smooth">
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  )
}
```

---

## MANUTENÇÃO

Para alterar cores ou tokens:

1. Editar `/app/globals.css` (tokens CSS)
2. Editar `/tailwind.config.ts` (extensões Tailwind)
3. Nunca alterar valores diretamente nos componentes

---

## VALIDAÇÃO

Antes de fazer PR:

- [ ] Nenhuma cor hardcoded
- [ ] Nenhum valor arbitrário de espaçamento
- [ ] Mobile-first respeitado
- [ ] Contraste AA validado
- [ ] Touch targets ≥ 44px no mobile
- [ ] Transições suaves aplicadas

---

**Última atualização**: Design System v1.0 - SaaS Multi-tenant
