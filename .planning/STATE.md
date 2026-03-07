---
gsd_state_version: 1.0
milestone: v1.4
milestone_name: faturas-de-cartao-no-fluxo-de-caixa
status: in_progress
last_updated: "2026-03-07T00:36:00.000Z"
progress:
  total_phases: 17
  completed_phases: 15
  total_plans: 49
  completed_plans: 46
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.
**Current focus:** executar fase 16 (fluxo de caixa consolidado por fatura).

## Current Position

Phase: 16 - fluxo de caixa consolidado por fatura
Plan: pendente
Status: Fase 15 concluida e verificada (3/3 planos executados)
Last activity: 2026-03-07 — fase 15 finalizada com motor de competencia materializado e edicao de `closeDay`/`dueDay`.

Progress: [████████░░] 80%

## Accumulated Context

### Decisions

- Fluxo de caixa prioriza clareza visual e leitura operacional.
- Investimentos permanecem modelados como transferencia interna atomica.
- Importacao textual adota parser deterministico e persistencia parcial com relatorio de erros.
- Autenticacao email/senha e isolamento por `userId` sao pre-condicao para evolucao multi-conta.
- Fatura de cartao substitui compras individuais no extrato principal do cashflow.
- Regra de competencia de cartao consolidada: `day < closeDay` na competencia corrente e `day >= closeDay` na seguinte.
- Despesas de cartao agora materializam `invoiceMonthKey` e `invoiceDueDate` no write path.
- Edicao de `closeDay`/`dueDay` disponivel no backend e UI, com efeito apenas para novos lancamentos (sem backfill).

### Pending Todos

- Planejar fase 16 com `$gsd-plan-phase 16`.

### Blockers/Concerns

- `npm run lint` bloqueado por tipagem PWA preexistente (`virtual:pwa-register` em `src/main.tsx`).

## Session Continuity

Last session: 2026-03-07
Stopped at: Phase 15 verified and closed
Resume file: .planning/phases/15-motor-de-competencia-de-fatura-por-fechamento/15-VERIFICATION.md
