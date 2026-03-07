---
phase: 21-card-mes-atual-com-saldo-real-drill-down-por-conta
plan: "01"
subsystem: cashflow-dashboard
tags: [cashflow, balance, projection]
requires:
  - phase: 20
    provides: Quitacao consolidada de fatura e status de quitacao operacional
provides:
  - Card `Mes atual` com separacao explicita de saldo real vs saldo previsto.
  - Preservacao da semantica de projecao no card `Proximo mes`.
affects: [phase-21-02, phase-21-03]
tech-stack:
  added: []
  patterns: [current-vs-projected-balance-card]
key-files:
  created: []
  modified:
    - src/app/foundation/cashflow/page.tsx
    - src/components/foundation/free-balance-semaphore.tsx
key-decisions:
  - "Saldo real do mes atual usa contas consolidadas (operacional), nao apenas previsao."
  - "Saldo previsto do mes atual continua exibido no mesmo card, separado do saldo real."
patterns-established:
  - "Card duplo com numero principal real e numero secundario previsto"
requirements-completed: [BAL-01, BAL-02, BAL-04]
duration: 35min
completed: 2026-03-07
---

# Phase 21 Plan 01 Summary

**O dashboard agora separa claramente posicao atual (`Saldo`) da previsao (`Saldo previsto`) no mes atual, mantendo o card do proximo mes como projecao.**

## Accomplishments
- Inclusao de fonte de `Saldo` via `accountsController.getConsolidatedBalance` no cashflow.
- Semaforo atualizado para exibir `Saldo` real e `Saldo previsto` no bloco de `Mes atual`.
- Semantica de `Proximo mes` preservada como leitura projetada.

## Task Commits
1. **Task 1 + Task 2** - `a7491fc` (feat)

## Automated Verification
- `npm test -- tests/e2e/cashflow-flow.spec.ts` ✓
- `npm test -- tests/modules/free-balance.service.test.ts` ✓
