---
phase: 25-reajuste-de-fatura-de-cartao
plan: "02"
subsystem: api
tags: [credit-cards, invoices, adjustments, runtime, vite-api, vitest]

requires:
  - phase: 25-01
    provides: credit-card adjustment service and controller contract
provides:
  - local runtime wiring for credit-card invoice adjustments
  - authenticated Vite API endpoint for persisted invoice adjustments
  - API runtime facade for card invoice adjustment submissions
affects: [25-reajuste-de-fatura-de-cartao, 26-preview-auditoria-e-salvaguardas-de-reajuste]

tech-stack:
  added: []
  patterns: [runtime facade parity between local and API modes, authenticated household isolation in Vite API routes]

key-files:
  created: []
  modified:
    - src/app/foundation/runtime.ts
    - src/server/vite-api.ts
    - tests/modules/credit-card-adjustments.service.test.ts
    - tests/modules/auth-api.test.ts

key-decisions:
  - "Both local runtime and API runtime expose invoicesController.createCreditCardAdjustment."
  - "POST /api/invoices/adjustment ignores client householdId and always uses the authenticated session household."
  - "The API runtime sends only cardId, realInvoiceTotal, dueMonth, and occurredAt."

patterns-established:
  - "Adjustment endpoints enforce ownership server-side before calculating or writing adjustment transactions."
  - "API runtime facades keep household isolation on the server by omitting householdId from request bodies."

requirements-completed:
  - CCADJ-01
  - CCADJ-02
  - CCADJ-03
  - CCADJ-04
  - CCADJ-05

duration: 6 min
completed: 2026-04-15
---

# Phase 25 Plan 02: API e Runtime de Reajuste de Fatura Summary

**Credit-card invoice adjustments are now available through local runtime wiring, the authenticated Vite API, and the API runtime facade.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-15T20:10:49Z
- **Completed:** 2026-04-15T20:16:49Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Wired `CreditCardAdjustmentsService` into the local runtime and exposed it through `invoicesController.createCreditCardAdjustment`.
- Added authenticated `POST /api/invoices/adjustment` support with card ownership validation and session household isolation.
- Added API runtime support that calls the persisted endpoint without trusting a client-provided household.
- Expanded module/API tests for local runtime behavior and authenticated API persistence.

## Task Commits

1. **Task 1 RED: Runtime adjustment coverage** - `9849788` (test)
2. **Task 1 GREEN: Local runtime wiring** - `8fe62ae` (feat)
3. **Task 2 RED: Authenticated API coverage** - `10df70a` (test)
4. **Task 2 GREEN: Persisted API endpoint** - `be70ba5` (feat)
5. **Task 3: API runtime facade** - `cac8979` (feat)

**Plan metadata:** included in the docs completion commit

## Files Created/Modified

- `src/app/foundation/runtime.ts` - Wires the local adjustment service and adds the API runtime facade method.
- `src/server/vite-api.ts` - Adds authenticated credit-card invoice adjustment endpoint.
- `tests/modules/credit-card-adjustments.service.test.ts` - Covers local runtime creation of invoice adjustments.
- `tests/modules/auth-api.test.ts` - Covers authenticated API adjustment persistence and household isolation.

## Decisions Made

- Kept household isolation in the server route by ignoring any `householdId` in the request body.
- Reused the existing invoice total service path inside the endpoint so persisted API behavior matches the domain service total calculation.
- Left zero-difference handling for Phase 26 as planned.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- `npm run lint` remains blocked by pre-existing unrelated TypeScript errors:
  - `src/main.tsx`: missing `virtual:pwa-register` type declaration.
  - `tests/modules/schedule-management.test.ts`: existing account fixture objects missing `goalAmount`, plus existing `monthKey` union typing issue.

## Verification

- `npm run test -- tests/modules/credit-card-adjustments.service.test.ts tests/modules/auth-api.test.ts` - passed, 11 tests.
- `npm run lint` - failed only on the pre-existing unrelated TypeScript errors listed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `25-03`: the cards UI can call `invoicesController.createCreditCardAdjustment` through both local and API runtimes.

---
*Phase: 25-reajuste-de-fatura-de-cartao*
*Completed: 2026-04-15*
