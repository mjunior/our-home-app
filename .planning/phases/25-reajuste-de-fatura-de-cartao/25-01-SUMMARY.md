---
phase: 25-reajuste-de-fatura-de-cartao
plan: "01"
subsystem: invoices
tags: [credit-cards, invoices, adjustments, transactions, categories, vitest]

requires:
  - phase: 24
    provides: account adjustment pattern with Reajuste category and explicit adjustment transactions
provides:
  - domain service for credit-card invoice adjustments
  - controller contract for creating credit-card invoice adjustments
  - signed REAJUSTE transaction pattern for increasing or reducing invoice totals
affects: [25-reajuste-de-fatura-de-cartao, 26-preview-auditoria-e-salvaguardas-de-reajuste]

tech-stack:
  added: []
  patterns: [domain service with repository-backed invoice total snapshot, optional controller service dependency]

key-files:
  created:
    - src/modules/invoices/credit-card-adjustments.service.ts
    - tests/modules/credit-card-adjustments.service.test.ts
  modified:
    - src/modules/invoices/invoices.controller.ts

key-decisions:
  - "Credit-card invoice adjustment uses signed EXPENSE transactions so positive values increase the invoice and negative values reduce it."
  - "Previous invoice total is read from InvoicesService.getCardInvoiceEntriesByDueMonth to preserve parity with card invoice detail."
  - "InvoicesController receives CreditCardAdjustmentsService optionally to preserve compatibility with existing callers."

patterns-established:
  - "Invoice adjustment: calculate realInvoiceTotal - previousInvoiceTotal and write explicit REAJUSTE card transaction."
  - "Controller adjustment contracts fail with a clear missing-service error when optional services are not wired."

requirements-completed:
  - CCADJ-02
  - CCADJ-03
  - CCADJ-04
  - CCADJ-05

duration: 2 min
completed: 2026-04-15
---

# Phase 25 Plan 01: Reajuste de Fatura de Cartao Summary

**Credit-card invoices can now be adjusted at the domain layer by recording signed `REAJUSTE` card transactions that move the invoice total to the real value.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-15T20:08:45Z
- **Completed:** 2026-04-15T20:10:49Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `CreditCardAdjustmentsService` to calculate the invoice delta from `InvoicesService.getCardInvoiceEntriesByDueMonth`.
- Reused/created normalized `Reajuste` category per household before writing adjustment transactions.
- Stored adjustments as signed credit-card `EXPENSE` transactions in the target `dueMonth`.
- Exposed `InvoicesController.createCreditCardAdjustment` with optional service wiring and clear missing-service error.
- Added coverage for positive adjustment, negative adjustment, category reuse, ownership blocking, and controller delegation.

## Task Commits

1. **Task 1 RED: Credit card adjustment service tests** - `7e5b827` (test)
2. **Task 1 GREEN: Credit card adjustment service** - `eb9edbd` (feat)
3. **Task 2 RED: Controller contract tests** - `06e1403` (test)
4. **Task 2 GREEN: Controller contract** - `2af2ec3` (feat)

**Plan metadata:** included in the docs completion commit

## Files Created/Modified

- `src/modules/invoices/credit-card-adjustments.service.ts` - Calculates invoice differences and creates signed `REAJUSTE` card transactions.
- `src/modules/invoices/invoices.controller.ts` - Adds optional adjustment service dependency and `createCreditCardAdjustment` delegation.
- `tests/modules/credit-card-adjustments.service.test.ts` - Covers domain and controller adjustment behavior.

## Decisions Made

- Used signed `EXPENSE` amounts instead of a new transaction kind so existing invoice summing can increase or reduce totals.
- Used the invoice-detail service as the source of truth for previous total, keeping one-off and scheduled invoice items aligned.
- Deferred zero-difference handling to Phase 26, as planned.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- `npm run lint` remains blocked by pre-existing unrelated TypeScript errors:
  - `src/main.tsx`: missing `virtual:pwa-register` type declaration.
  - `tests/modules/schedule-management.test.ts`: existing account fixture objects missing `goalAmount`, plus existing `monthKey` union typing issue.

## Verification

- `npm run test -- tests/modules/credit-card-adjustments.service.test.ts tests/modules/invoices.service.test.ts` - passed, 18 tests.
- `npm run lint` - failed only on the pre-existing unrelated TypeScript errors listed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `25-02`: domain/controller contract for credit-card invoice adjustment exists and can be wired into runtime and Vite API.

---
*Phase: 25-reajuste-de-fatura-de-cartao*
*Completed: 2026-04-15*
