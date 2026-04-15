---
phase: 25-reajuste-de-fatura-de-cartao
plan: "03"
subsystem: ui
tags: [credit-cards, invoices, adjustments, react, jsdom, vitest]

requires:
  - phase: 25-02
    provides: local and API runtime method for credit-card invoice adjustments
provides:
  - card invoice adjustment entry point in the cards UI
  - adjustment sheet collecting real invoice total, due month, and adjustment date
  - e2e coverage proving UI refresh and REAJUSTE transaction placement
affects: [25-reajuste-de-fatura-de-cartao, 26-preview-auditoria-e-salvaguardas-de-reajuste]

tech-stack:
  added: []
  patterns: [invoice row secondary action with propagation guard, runtime-backed adjustment sheet]

key-files:
  created: []
  modified:
    - src/app/foundation/cards/page.tsx
    - tests/e2e/cards-flow.spec.ts

key-decisions:
  - "The adjustment action lives beside existing invoice payment actions and stops row-click propagation."
  - "The sheet defaults to the selected due month and formats the real total with existing BRL input helpers."
  - "The user-facing flow calls invoicesController.createCreditCardAdjustment and refreshes invoice list/detail on success."

patterns-established:
  - "Card invoice adjustment UI mirrors the account adjustment flow while keeping card-specific dueMonth semantics."
  - "Snackbar assertions in isolated jsdom renders use SnackbarProvider only for tests that validate notifications."

requirements-completed:
  - CCADJ-01
  - CCADJ-05

duration: 4 min
completed: 2026-04-15
---

# Phase 25 Plan 03: Reajuste de Fatura na Tela de Cartoes Summary

**The cards screen now lets users adjust a visible invoice to its real total and immediately shows the resulting `REAJUSTE` item in the invoice detail.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-15T20:16:49Z
- **Completed:** 2026-04-15T20:20:59Z
- **Tasks:** 3
- **Files modified:** 2

## Accomplishments

- Added an accessible `Reajustar fatura [cartao]` action to each monthly invoice row.
- Added a dedicated adjustment sheet with real invoice total, due month, and adjustment date fields.
- Submitted adjustments through `invoicesController.createCreditCardAdjustment`, refreshed invoice state, closed the sheet, and notified success.
- Added jsdom e2e coverage that adjusts a `100.00` invoice to `135.00`, verifies updated UI totals, and validates the `REAJUSTE` transaction.

## Task Commits

1. **Task 3 RED: Card invoice adjustment e2e coverage** - `fbc47c2` (test)
2. **Tasks 1-2 GREEN: Cards UI adjustment entry and sheet** - `56c60ff` (feat)

**Plan metadata:** included in the docs completion commit

## Files Created/Modified

- `src/app/foundation/cards/page.tsx` - Adds invoice adjustment action, controlled sheet state, form submission, and refresh behavior.
- `tests/e2e/cards-flow.spec.ts` - Covers the positive adjustment flow from invoice list through persisted transaction assertions.

## Decisions Made

- Placed the adjustment button in the existing invoice action row so paying, unpaying, adding expenses, and selecting detail remain unchanged.
- Used `formatCurrencyInputBRL` and `currencyInputToDecimal` to match the account adjustment input behavior.
- Kept preview and zero-difference handling out of this plan because Phase 26 owns those safeguards.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- Isolated page tests render without a snackbar provider by default, so the new notification assertion wraps only this flow in `SnackbarProvider`.
- `npm run lint` remains blocked by pre-existing unrelated TypeScript errors:
  - `src/main.tsx`: missing `virtual:pwa-register` type declaration.
  - `tests/modules/schedule-management.test.ts`: existing account fixture objects missing `goalAmount`, plus existing `monthKey` union typing issue.

## Verification

- `npm run test -- tests/e2e/cards-flow.spec.ts` - passed, 5 tests.
- `npm run test -- tests/e2e/cards-flow.spec.ts tests/modules/credit-card-adjustments.service.test.ts` - passed, 11 tests.
- `npm run lint` - failed only on the pre-existing unrelated TypeScript errors listed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for Phase 26: account and card adjustment flows both exist end-to-end, leaving preview, zero-difference handling, and shared audit safeguards for the next phase.

---
*Phase: 25-reajuste-de-fatura-de-cartao*
*Completed: 2026-04-15*
