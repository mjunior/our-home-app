# Nosso Lar Financeiro

## What This Is

Aplicativo web para gestao financeira da casa, mobile-first, com foco em decisao de gasto a partir do saldo livre, fluxo de caixa confiavel e previsao de compromissos futuros.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.1 Lancamentos Unificados e Investimento por Transferencia

**Goal:** Unificar o fluxo de novo lancamento para avulso/recorrencia/parcelamento e formalizar investimento como transferencia rastreavel entre contas.

**Target features:**
- Fluxo unico de novo lancamento com tipo de transacao (avulso, recorrencia, parcelamento)
- Investimento tratado como saida operacional separada de gasto e entrada em conta de investimento
- Modelo de contas com Conta Corrente e Conta Investimento

## Requirements

### Validated

- ✓ Fundacao financeira (contas, cartoes, categorias) — v1.0
- ✓ Fluxo de caixa e faturas — v1.0
- ✓ Motor inicial de recorrencias/parcelas — v1.0
- ✓ Dashboard de saldo livre atual e projetado — v1.0
- ✓ Persistencia SQLite/Prisma integrada ao runtime principal — v1.0

### Active

- [ ] Unificar recorrencia e parcelamento como tipos de transacao no mesmo fluxo de lancamento
- [ ] Implementar investimento como transferencia obrigatoria entre origem e destino
- [ ] Introduzir tipagem de contas: Conta Corrente e Conta Investimento

### Out of Scope

- Integracao automatica Open Finance neste milestone
- Aplicativos mobile nativos
- Trading/operacoes avancadas de investimento

## Context

- v1.0 shipado com UX mobile premium e persistencia real.
- Novo direcionamento do v1.1: parcelamentos e recorrencias passam a nascer no mesmo fluxo de lancamento.
- Investimento passa a ser tratado como movimentacao de transferencia (saida de origem + entrada em destino), nao como gasto comum.

## Constraints

- **Delivery**: manter funcionalidades atuais estaveis durante a reestruturacao.
- **Data Integrity**: historico financeiro nao pode ser corrompido por edicoes de recorrencia/parcela.
- **UX**: manter experiencia premium mobile-first sem regressao.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fechar v1.0 com gaps conhecidos (investimentos/wishlist) | Entregar base funcional e persistencia antes de ampliar escopo | ✓ Accepted |
| Unificar recorrencia e parcelamento no mesmo fluxo de novo lancamento | Reduz complexidade de UX e padroniza regras do dominio | — In Progress |
| Tratar investimento como transferencia entre contas | Garante rastreabilidade contabil (saida de um lugar, entrada em outro) | — In Progress |
| Adotar tipagem de conta (Conta Corrente e Conta Investimento) | Simplifica regras de destino para aportes e consolidacao | — In Progress |

---
*Last updated: 2026-03-03 after v1.1 scope reset for unified launches and investment transfers*
