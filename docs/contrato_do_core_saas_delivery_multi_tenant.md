# 📜 CONTRATO DO CORE – SaaS MULTI‑TENANT (DELIVERY)

Este documento define **as regras imutáveis do Core** do sistema.
Toda IA, código, módulo ou feature **DEVE obedecer este contrato**.
Nada aqui contém regra de negócio de delivery.

---

## 1️⃣ PRINCÍPIOS FUNDAMENTAIS

1. O sistema é **SaaS Multi‑Tenant**
2. O **Core é neutro** (não conhece delivery, pedidos, motoboy etc)
3. Todo dado operacional pertence a **um único tenant**
4. O **SaaS Admin** é separado de tenants
5. Funcionalidades são entregues via **módulos plugáveis**
6. White‑label é **nativo**, nunca opcional
7. Billing e planos existem desde o início

---

## 2️⃣ ENTIDADES CONCEITUAIS (SEM BANCO AINDA)

### 🔹 SaaS Admin

Usuários que administram a plataforma inteira.

* Não pertencem a tenant
* Não acessam dados de tenants diretamente
* Podem gerenciar tenants, planos, módulos e branding

---

### 🔹 Tenant

Representa um cliente (ex: restaurante, rede, franquia).

* Possui plano
* Possui módulos ativos
* Possui usuários próprios
* Possui branding próprio

---

### 🔹 Tenant User

Usuário que pertence a **um tenant específico**.

* Sempre vinculado a um tenant
* Nunca acessa outro tenant

---

### 🔹 Módulo

Funcionalidade independente acoplada ao Core.

* Pode ser ativado ou desativado por tenant
* Define permissões próprias
* Não acessa outro módulo diretamente

---

### 🔹 Plano

Define limites e acesso.

* Controla módulos disponíveis
* Define limites de uso

---

## 3️⃣ AUTENTICAÇÃO (REGRAS OBRIGATÓRIAS)

### 🔐 Separação absoluta

* Auth do **SaaS Admin** é separado do tenant
* Tokens NÃO são reutilizados

### 🔐 Token de Tenant deve conter

* user_id
* tenant_id
* role
* permissões
* módulos ativos

### 🔐 Token do SaaS Admin deve conter

* user_id
* role_saas

---

## 4️⃣ MULTI‑TENANCY (REGRA DE OURO)

> **Toda tabela operacional DEVE conter tenant_id**

Exceções:

* SaaS Admin
* Planos globais
* Módulos globais

---

## 5️⃣ AUTORIZAÇÃO (RBAC)

* Permissões são por tenant
* Roles pertencem a um tenant
* Módulos registram permissões no Core

Fluxo:

\`\`\`
request → auth → tenant → plano → módulo → permissão
\`\`\`

---

## 6️⃣ SISTEMA DE MÓDULOS

### 📦 Definição

Um módulo é uma unidade isolada que:

* Registra rotas
* Registra permissões
* Registra eventos

### 📦 Regras

* Módulos NÃO alteram o Core
* Módulos NÃO acessam banco de outros módulos
* Comunicação via eventos

---

## 7️⃣ WHITE‑LABEL

### 🎨 Global (SaaS)

* Nome do sistema
* Marca padrão
* Emails default

### 🎨 Por Tenant

* Logo
* Cores
* Domínio
* Identidade visual

Nada pode ser hardcoded.

---

## 8️⃣ BILLING E PLANOS

Mesmo sem cobrança inicial:

* Todo tenant possui plano
* Todo módulo está associado a plano
* Limites são obrigatórios

---

## 9️⃣ EVENTOS E AUDITORIA

Tudo relevante gera evento:

* Login
* Alteração de plano
* Ativação de módulo
* Ações críticas

---

## 🔟 O CORE NÃO PODE

❌ Conhecer regras de delivery
❌ Conhecer pedidos
❌ Conhecer motoboys
❌ Ter lógica de negócio específica

---

## ✅ O CORE DEVE

✔ Ser estável
✔ Ser extensível
✔ Ser previsível
✔ Ser respeitado por TODA IA

---

## 🧠 USO OBRIGATÓRIO DA FUNÇÃO RULES (IA)

Sempre registrar estas regras na ferramenta de IA:

* Este contrato é imutável
* Qualquer código que viole o contrato é inválido
* IA não pode inferir regras fora deste documento

---

## 📌 FRASE FINAL (IMPORTANTE)

> **A IA escreve código. O contrato decide o sistema.**
