# Nosso Lar Financeiro

## What This Is

Aplicativo web de gestao financeira domestica, mobile-first, focado em decisao operacional de caixa com saldo livre explicavel, compromissos futuros previsiveis e separacao correta entre consumo e investimento.

O produto agora possui fluxo completo de cartao de credito por fatura: regra de fechamento/vencimento, consolidacao no cashflow e manutencao de itens no modulo de cartoes.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current State

- Milestone entregue: **v1.5 UX de Faturas em Cartoes** (2026-03-07).
- Cartao de credito tratado por competencia de fatura com `closeDay` e `dueDay` por cartao.
- Cashflow principal exibe obrigacao consolidada de fatura, nao compras individuais de cartao.
- Modulo de cartoes permite listar faturas por mes e editar/excluir itens no proprio contexto.

## Next Milestone Goals

- Evoluir ciclo de pagamento de fatura com suporte a pagamento parcial.
- Introduzir modelagem de saldo remanescente e simulacao de juros/rotativo.
- Definir canal de notificacao de vencimento (push/email) com estrategia de entrega.

## Requirements

### Validated

- ✓ Fluxo unificado de lancamentos (avulso/recorrente/parcelado/investimento) — v1.1
- ✓ Home de cashflow refinada com navegacao mensal consistente — v1.2
- ✓ Importacao textual em lote com parser e persistencia parcial — v1.2
- ✓ Autenticacao por conta com isolamento de dados por `userId` — v1.3
- ✓ Cartao por fatura no fluxo de caixa com regra de fechamento/vencimento — v1.4
- ✓ UX operacional de faturas no modulo de cartoes — v1.5

### Active

- [ ] CCX-01: Pagamento parcial de fatura com saldo remanescente
- [ ] CCX-02: Simulacao de juros/rotativo da fatura
- [ ] CCX-03: Notificacoes de vencimento

### Out of Scope

- Integracao Open Finance para ingestao automatica de fatura
- Multi-moeda para cartao
- Split automatico de uma compra em multiplas faturas

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Competencia da compra usa fechamento inclusivo (`day >= closeDay` vai para proxima fatura) | Reproduz comportamento real de cartao informado pelo usuario | ✓ Good |
| Cashflow operacional mostra fatura consolidada por cartao | Reduz ruido e melhora previsibilidade de caixa | ✓ Good |
| Detalhamento por compra permanece no modulo de cartoes | Separa visao operacional (caixa) da visao analitica (cartao) | ✓ Good |

## Milestone History

- `v1.0` roadmap/requirements: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`
- `v1.1` roadmap/requirements: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`
- `v1.2` roadmap/requirements: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`
- `v1.4` roadmap: `.planning/milestones/v1.4-ROADMAP.md`
- `v1.5` roadmap/requirements: `.planning/milestones/v1.5-ROADMAP.md`, `.planning/milestones/v1.5-REQUIREMENTS.md`

---
*Last updated: 2026-03-07 after milestone v1.5 completion*
