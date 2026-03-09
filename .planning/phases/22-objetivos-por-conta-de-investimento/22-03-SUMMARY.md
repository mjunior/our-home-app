---
phase: 22-objetivos-por-conta-de-investimento
plan: "03"
subsystem: accounts-ux-regression
tags: [accounts, goals, regression, e2e]
requires:
  - phase: 22-02
    provides: goalAmount disponivel na UI e na API
provides:
  - Visualizacao de progresso e faltante nas contas de investimento.
  - Cobertura de regressao para meta atingida e nao regressao no cashflow.
affects: []
tech-stack:
  added: []
  patterns: [investment-goal-progress-card]
key-files:
  created: []
  modified:
    - src/components/foundation/consolidated-balance-card.tsx
    - tests/modules/foundation-api.test.ts
    - tests/e2e/foundation-flow.spec.ts
    - tests/e2e/cashflow-flow.spec.ts
key-decisions:
  - "Meta atingida usa copy positiva e nunca exibe faltante negativo."
  - "Cashflow recebe apenas regressao indireta; a meta nao altera seus calculos."
patterns-established:
  - "Card de investimento com progresso percentual + CTA de editar objetivo"
requirements-completed: [INVG-04, INVG-05]
duration: 30min
completed: 2026-03-09
---

# Phase 22 Plan 03 Summary

**O modulo de contas agora comunica progresso de objetivo de investimento de forma visivel, com regressao documentada para os estados limite.**

## Accomplishments
- Cartoes de investimento passaram a mostrar meta, percentual, barra de progresso e mensagem de faltante/objetivo concluido.
- Testes de modulo cobrem meta parcial, meta atingida e ausencia de impacto no saldo consolidado.
- Testes e2e foram ampliados para criar e editar meta e manter o cashflow sem regressao quando a conta investimento possui objetivo.

## Task Commits
1. **Task 1 + Task 2** - pending manual commit aggregation in this session

## Automated Verification
- `npm run test -- tests/modules/foundation-api.test.ts tests/e2e/foundation-flow.spec.ts tests/e2e/cashflow-flow.spec.ts` not run - `node`/`npm` indisponiveis no PATH deste ambiente
