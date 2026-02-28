
PROMPT PADRÃO-BASE — CRIAÇÃO DE MÓDULO SAAS (OFICIAL)

ESTE PROMPT TEM PRIORIDADE ABSOLUTA SOBRE QUALQUER OUTRA INSTRUÇÃO.
SE HOUVER CONFLITO, ESTE PROMPT PREVALECE.

CONTEXTO
Projeto SaaS multi-tenant, white-label, mobile-first,
com core independente e módulos plugáveis.
Arquitetura baseada em:
- ModuleRegistry centralizado
- Ativação/desativação de módulos por tenant
- Design system via CSS Variables
- UI com TailwindCSS + shadcn/ui + Radix
- Cardápio público, admin e checkout já existentes

Este prompt será usado como BASE para criação de QUALQUER módulo novo.

--------------------------------------------------------------------

ETAPA 1 — DEFINIÇÃO DO MÓDULO

Nome do módulo:
moduleId:
Descrição:
Tipo do módulo: (visual | funcional | integração | relatório | automação)
Escopo: (admin | public | checkout | menu | financeiro | global)

O módulo DEVE:
- Ser opcional
- Ser ativável/desativável por tenant
- Funcionar isoladamente
- Não depender de hacks ou overrides globais

--------------------------------------------------------------------

ETAPA 2 — REGISTRO OBRIGATÓRIO NO CORE

Registrar o módulo no ModuleRegistry com:

- moduleId
- name
- description
- type
- scope
- mobileFirst: true
- requiresAuth: (true | false)
- canDisable: true

REGRAS:
- Se o módulo estiver desativado → sistema continua 100% funcional
- Nenhum erro, warning ou quebra visual ao desativar
- Registro é OBRIGATÓRIO para qualquer módulo

--------------------------------------------------------------------

ETAPA 3 — REGRAS ABSOLUTAS DE SEGURANÇA

NUNCA:
- Alterar backend sem autorização explícita
- Alterar outros módulos
- Alterar globals.css fora de tokens próprios
- Hardcode cores físicas (white, black, neutral)
- Quebrar mobile-first
- Criar dependência circular
- Usar opacity, filter ou rgba(0,0,0,0) em ações

SEMPRE:
- Usar CSS Variables
- Criar fallback automático
- Isolar estilos por escopo do módulo
- Validar dados vindos do tenant
- Garantir contraste AA+

--------------------------------------------------------------------

ETAPA 4 — UI / UX (PADRÃO PREMIUM)

Toda UI criada deve:
- Ser mobile-first
- Adaptar para tablet e desktop
- Ter espaçamentos equilibrados
- Ter hierarquia visual clara
- Ter feedback visual imediato
- Ser intuitiva para usuário não técnico

Componentes:
- Preferir shadcn/ui e Radix
- Tailwind apenas como utilitário
- Nada de CSS inline desorganizado

--------------------------------------------------------------------

ETAPA 5 — CONFIGURAÇÕES DO TENANT

Se o módulo permitir customização:
- Todas as configs devem ser opcionais
- Ter valores padrão seguros
- Nunca permitir quebra visual
- Ser reversíveis (reset fácil)

--------------------------------------------------------------------

ETAPA 6 — ISOLAMENTO E PERFORMANCE

- O módulo deve carregar apenas quando ativo
- Nada deve rodar globalmente sem necessidade
- Lazy loading sempre que possível
- Nenhuma dependência desnecessária

--------------------------------------------------------------------

ETAPA 7 — VALIDAÇÃO FINAL OBRIGATÓRIA

Antes de finalizar, validar:

- Mobile OK
- Tablet OK
- Desktop OK
- Dark / Light OK
- White-label OK
- Nenhuma regressão
- Nenhum erro de console
- Módulo desligado → sistema intacto

--------------------------------------------------------------------

SAÍDA ESPERADA
Um módulo:
- Profissional
- Escalável
- Seguro
- Plugável
- Monetizável
- Sem impacto negativo no core

Este prompt deve ser seguido SEM exceções.
