# Nosso Lar Financeiro

## What This Is

Aplicativo web de gestao financeira domestica, mobile-first, focado em decisao operacional de caixa com saldo livre explicavel, compromissos futuros previsiveis e separacao correta entre consumo e investimento.

Neste milestone, o produto passa a operar com autenticacao por conta (email/senha), isolamento estrito de dados por usuario e rotas protegidas para impedir acesso nao autenticado.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.3 Autenticacao e Isolamento de Conta

**Goal:** Permitir uso seguro por multiplas contas com login por email/senha e segregacao total de dados financeiros por usuario.

**Target features:**
- Login com email/senha e sessao autenticada.
- Cadastro simplificado em rota nao indexada e sem links publicos.
- Isolamento multi-tenant por `userId` em todas as consultas e mutacoes financeiras.
- Bloqueio de acesso: apenas `/login` e `/n-account` sem autenticacao.
- Nova raiz `/` como pagina de login non-index com visual alinhado ao contexto familiar.

## Requirements

### Validated

- ✓ Fluxo unificado de lancamentos (avulso/recorrente/parcelado/investimento) — v1.1
- ✓ Home de cashflow refinada com navegacao mensal consistente — v1.2
- ✓ Importacao textual em lote com parser e persistencia parcial — v1.2

### Active

- [ ] Usuario pode criar conta com email e senha via rota dedicada de teste (`/n-account`).
- [ ] Usuario autenticado acessa somente os proprios dados financeiros.
- [ ] Todas as rotas da aplicacao, exceto `/login` e `/n-account`, exigem autenticacao.
- [ ] Raiz `/` exibe login non-index com interface premium e foco familiar.

### Out of Scope

- Recuperacao de senha por email — adiar para proximo milestone para manter foco em isolamento e login base.
- OAuth/social login — email/senha e suficiente para o milestone atual.
- RBAC multi-perfil (admin/familiares com papeis) — nao necessario para o primeiro corte de contas.

## Context

- Ultima versao entregue: `v1.2` (2026-03-03), milestone encerrado e arquivado.
- Base atual opera sem autenticacao e com visao unica de dados.
- Novo milestone precisa introduzir fronteira de seguranca sem quebrar UX atual de cashflow.

## Constraints

- **Security**: Isolamento por conta deve ser aplicado em backend e banco — sem vazamento cruzado.
- **Product**: Cadastro deve continuar simples (apenas email e senha) — facilitar onboarding e testes.
- **UX**: Login deve ser pagina principal (`/`) com noindex — evitar indexacao publica.
- **Routing**: Nao expor links entre `/login` e `/n-account` — reduzir descoberta automatizada de rota de cadastro.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Adotar milestone dedicado para autenticacao antes de novas features | Sem isolamento por usuario, crescimento funcional aumenta risco de vazamento | — Pending |
| Manter rota de cadastro isolada e sem navegacao publica (`/n-account`) para fase de testes | Facilita habilitar contas sem abrir fluxo publico de signup | — Pending |
| Tratar todas as operacoes financeiras como escopo obrigatorio de `userId` | Garantia de segregacao de dados em leitura e escrita | — Pending |

## Milestone History

- `v1.0` roadmap/requirements: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`
- `v1.1` roadmap/requirements: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`
- `v1.2` roadmap/requirements: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`

---
*Last updated: 2026-03-05 after milestone v1.3 initialization*
