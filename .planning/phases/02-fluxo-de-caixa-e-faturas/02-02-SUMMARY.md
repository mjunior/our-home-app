---
phase: 02-fluxo-de-caixa-e-faturas
plan: "02"
subsystem: api
tags: [invoices, card-cycle, projection]
requires:
  - phase: 02-01
    provides: transaction ledger with card expenses
provides:
  - Invoice cycle assignment utility
  - Current/next invoice projection per card
  - Monthly cashflow summary with card obligations
affects: [cashflow-ui, free-balance-engine]
tech-stack:
  added: []
  patterns: [cycle-service-first invoice aggregation]
key-files:
  created:
    - src/modules/invoices/invoice-cycle.service.ts
    - src/modules/invoices/invoices.service.ts
    - src/modules/invoices/invoices.controller.ts
    - tests/modules/invoice-cycle.service.test.ts
    - tests/modules/invoices.service.test.ts
  modified: []
key-decisions:
  - "Cycle boundary controlled only by closeDay in one service"
  - "Invoice read model computed from ledger entries"
patterns-established:
  - "Current/next projection uses deterministic month keys"
requirements-completed: [CARD-03, CASH-03, CARD-02]
duration: 14min
completed: 2026-03-02
---

# Phase 2: Invoice Projection Summary

**Credit-card invoice cycle engine and current/next fatura projection APIs are now operational.**

## Performance
- **Duration:** 14 min
- **Started:** 2026-03-02T20:59:00Z
- **Completed:** 2026-03-02T21:01:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added cycle resolver for close-day boundary behavior.
- Implemented invoice service/controller for current and next totals.
- Added tests for cycle edge cases and monthly obligations.

## Task Commits
1. **Task 1: Cycle utility** - `42b4b3f` (feat)
2. **Task 2: Invoice service/controller** - `86cb7e0` (feat)

**Plan metadata:** included in phase completion commit.

## Files Created/Modified
- `src/modules/invoices/invoice-cycle.service.ts`
- `src/modules/invoices/invoices.service.ts`
- `src/modules/invoices/invoices.controller.ts`
- `tests/modules/invoice-cycle.service.test.ts`
- `tests/modules/invoices.service.test.ts`

## Decisions Made
- Left projection independent from recurring/parceling logic (phase 3 scope).

## Deviations from Plan
None - plan executed as intended.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
UI can consume invoice projections and monthly statement summary.

---
*Phase: 02-fluxo-de-caixa-e-faturas*
*Completed: 2026-03-02*
