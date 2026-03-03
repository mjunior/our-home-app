# Nosso Lar Financeiro

## What This Is

Aplicativo web para gestao financeira da casa, mobile-first, com foco em decisao de gasto a partir do saldo livre, fluxo de caixa confiavel e previsao de compromissos futuros.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.1 Reestruturacao de Compromissos e Investimentos

**Goal:** Reestruturar o motor de recorrencias/parcelamentos e entregar modulo de investimentos confiavel sobre a base persistente.

**Target features:**
- Reestruturacao de recorrencias e parcelamentos com previsibilidade e manutencao simplificada
- Investimentos (posicao, eventos e consolidacao)
- Hardening da API (contratos, validacao, erros e modularizacao)

## Requirements

### Validated

- ✓ Fundacao financeira (contas, cartoes, categorias) — v1.0
- ✓ Fluxo de caixa e faturas — v1.0
- ✓ Motor inicial de recorrencias/parcelas — v1.0
- ✓ Dashboard de saldo livre atual e projetado — v1.0
- ✓ Persistencia SQLite/Prisma integrada ao runtime principal — v1.0

### Active

- [ ] Reestruturar modelagem e engine de recorrencias/parcelamentos para evolucao segura
- [ ] Entregar modulo de investimentos com eventos e consolidacao
- [ ] Melhorar qualidade arquitetural da API para padrao de producao

### Out of Scope

- Integracao automatica Open Finance neste milestone
- Aplicativos mobile nativos
- Wishlist de compras (deferida para milestone futuro)

## Context

- v1.0 shipado com UX mobile premium e persistencia real.
- Feedback principal do fechamento: qualidade estrutural da API precisa subir de nivel.
- Proximo ciclo prioriza robustez de compromissos financeiros futuros e investimentos.

## Constraints

- **Delivery**: manter funcionalidades atuais estaveis durante a reestruturacao.
- **Data Integrity**: historico financeiro nao pode ser corrompido por edicoes de recorrencia/parcela.
- **UX**: manter experiencia premium mobile-first sem regressao.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fechar v1.0 com gaps conhecidos (investimentos/wishlist) | Entregar base funcional e persistencia antes de ampliar escopo | ✓ Accepted |
| Priorizar reestruturacao de compromissos + investimentos no v1.1 | Sao os maiores impactos de valor e risco tecnico atuais | — In Progress |
| Tratar hardening da API como parte do milestone (nao adiar) | Qualidade percebida e manutencao exigem isso agora | — In Progress |

---
*Last updated: 2026-03-03 after v1.0 closure and v1.1 kickoff*
