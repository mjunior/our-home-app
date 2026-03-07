---
phase: 21-card-mes-atual-com-saldo-real-drill-down-por-conta
verified: 2026-03-07T00:40:00-03:00
status: passed
score: 4/4 must-haves verified
---

# Phase 21: Card Mes Atual com Saldo Real + Drill-down por Conta Verification Report

## Goal Achievement

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Card `Mes atual` mostra `Saldo` real separado de `Saldo previsto` | ✓ VERIFIED | `src/components/foundation/free-balance-semaphore.tsx`, `src/app/foundation/cashflow/page.tsx` |
| 2 | Clique no `Saldo` abre composicao por conta | ✓ VERIFIED | `src/app/foundation/cashflow/page.tsx`, `tests/e2e/cashflow-flow.spec.ts` |
| 3 | Extrato mantém quitacao acionavel com recalculo imediato | ✓ VERIFIED | `src/app/foundation/cashflow/page.tsx`, `tests/e2e/cashflow-flow.spec.ts` |
| 4 | Card `Proximo mes` preserva semantica de previsao | ✓ VERIFIED | `src/components/foundation/free-balance-semaphore.tsx`, `tests/e2e/free-balance-dashboard.spec.ts` |

## Requirements Coverage

| Requirement | Status |
|-------------|--------|
| BAL-01 | ✓ SATISFIED |
| BAL-02 | ✓ SATISFIED |
| BAL-03 | ✓ SATISFIED |
| BAL-04 | ✓ SATISFIED |
| CFP-01 | ✓ SATISFIED |
| CFP-02 | ✓ SATISFIED |
| CFP-03 | ✓ SATISFIED |

## Automated Verification

- `npm test -- tests/e2e/cashflow-flow.spec.ts tests/e2e/free-balance-dashboard.spec.ts tests/e2e/foundation-flow.spec.ts tests/modules/foundation-api.test.ts tests/modules/free-balance.service.test.ts` ✓
- `npm run lint` ✗ (preexistente: `virtual:pwa-register` em `src/main.tsx`)
