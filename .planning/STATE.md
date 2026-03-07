---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: faturas-de-cartao-no-fluxo-de-caixa
status: in_progress
last_updated: "2026-03-07T01:35:00.000Z"
progress:
  total_phases: 17
  completed_phases: 16
  total_plans: 49
  completed_plans: 46
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.
**Current focus:** planejar e executar fase 17 (tela de cartao com lista de faturas e drill-down).

## Current Position

Phase: 17 - tela de cartao com lista de faturas e drill-down
Plan: pendente
Status: Fase 16 concluida e verificada (3/3 planos executados)
Last activity: 2026-03-07 — fase 16 finalizada com consolidacao de fatura no cashflow e navegacao contextual para cartoes.

Progress: [█████████░] 94%

## Accumulated Context

### Decisions

- Fluxo de caixa prioriza clareza visual e leitura operacional.
- Investimentos permanecem modelados como transferencia interna atomica.
- Importacao textual adota parser deterministico e persistencia parcial com relatorio de erros.
- Autenticacao email/senha e isolamento por `userId` sao pre-condicao para evolucao multi-conta.
- Fatura de cartao substitui compras individuais no extrato principal do cashflow.
- Regra de competencia de cartao consolidada: `day < closeDay` na competencia corrente e `day >= closeDay` na seguinte.
- Despesas de cartao materializam `invoiceMonthKey` e `invoiceDueDate` no write path.
- Edicao de `closeDay`/`dueDay` disponivel no backend e UI, com efeito apenas para novos lancamentos (sem backfill).
- Linha de fatura no cashflow navega para modulo de cartoes com contexto de cartao e competencia.

### Pending Todos

- Planejar fase 17 com `$gsd-plan-phase 17`.

### Blockers/Concerns

- `npm run lint` bloqueado por tipagem PWA preexistente (`virtual:pwa-register` em `src/main.tsx`).

## Session Continuity

Last session: 2026-03-07
Stopped at: Phase 16 verified and closed
Resume file: .planning/phases/16-fluxo-de-caixa-consolidado-por-fatura/16-VERIFICATION.md
