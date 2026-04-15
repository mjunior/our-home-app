---
phase: 24-reajuste-de-saldo-em-conta
plan: "03"
subsystem: ui
tags: [accounts, adjustments, react, vitest, jsdom]

requires:
  - phase: 24-02
    provides: runtime facade and authenticated API path for creating account adjustments
provides:
  - per-account adjustment entry point on the accounts screen
  - account adjustment sheet with real balance, competence month, and adjustment date
  - e2e coverage proving UI adjustment updates account balance and creates paid REAJUSTE transaction
affects: [24-reajuste-de-saldo-em-conta, 25-reajuste-de-fatura-de-cartao, 26-preview-auditoria-e-salvaguardas-de-reajuste]

tech-stack:
  added: []
  patterns: [account-scoped sheet forms using runtime facade, jsdom flow assertions against runtime repositories]

key-files:
  created:
    - .planning/phases/24-reajuste-de-saldo-em-conta/24-03-SUMMARY.md
  modified:
    - src/components/foundation/consolidated-balance-card.tsx
    - src/app/foundation/accounts/page.tsx
    - tests/e2e/foundation-flow.spec.ts
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "Reajuste abre por conta a partir do card consolidado usando aria-label especifico por nome de conta."
  - "A UI envia occurredAt ao runtime sempre ao meio-dia UTC na data escolhida para preservar o contrato de Plan 24-02."
  - "Ao erro, o sheet permanece aberto e apenas o snackbar informa a falha."

patterns-established:
  - "Sheets de conta mantem estado controlado no page component e chamam o runtime facade diretamente."
  - "Fluxos e2e que abrem Radix Sheets devem limpar o DOM entre testes e aguardar submissao assincrona antes de validar a tela."

requirements-completed:
  - ACADJ-01
  - ACADJ-05

duration: 6 min
completed: 2026-04-15
---

# Phase 24 Plan 03: Reajuste de Saldo em Conta Summary

**Accounts screen now lets users launch an account adjustment from each visible account, submit the real balance/month/date, and see the updated balance backed by a paid REAJUSTE transaction.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-15T19:59:35Z
- **Completed:** 2026-04-15T20:05:32Z
- **Tasks:** 3
- **Files modified:** 3 implementation/test files plus planning metadata

## Accomplishments

- Added accessible `Reajustar` action for each account in the consolidated balance card.
- Added an accounts-page adjustment sheet showing account name/current app balance and collecting real balance, competence month, and adjustment date.
- Wired submit to `accountsController.createAccountAdjustment`, refreshing the accounts screen and preserving the sheet on failure.
- Added jsdom e2e coverage for a positive adjustment from `500.00` to `650.00`, asserting the updated UI and paid `REAJUSTE` income transaction.

## Task Commits

1. **Task 3 RED: Account adjustment flow coverage** - `ae610a0` (test)
2. **Tasks 1-3 GREEN: Card entry point, sheet, runtime submit, and green e2e flow** - `6ada869` (feat)

**Plan metadata:** included in the docs completion commit

## Files Created/Modified

- `src/components/foundation/consolidated-balance-card.tsx` - Adds optional `onAdjustAccount` callback and per-account `Reajustar` action without removing investment-goal editing.
- `src/app/foundation/accounts/page.tsx` - Adds account adjustment sheet, controlled fields, runtime submit, refresh, success/error snackbar handling.
- `tests/e2e/foundation-flow.spec.ts` - Adds account adjustment flow coverage and test cleanup/waiting needed for stable jsdom sheet flows.
- `.planning/phases/24-reajuste-de-saldo-em-conta/24-03-SUMMARY.md` - Documents plan execution.
- `.planning/STATE.md` - Updates current project state after 24-03.
- `.planning/ROADMAP.md` - Marks Phase 24 complete and updates v1.8 plan progress.

## Decisions Made

- Kept adjustment state local to `AccountsPage`, matching the existing account creation and investment-goal sheet pattern.
- Used `type="month"` and `type="date"` inputs with current-day defaults and converted the selected date to `T12:00:00.000Z`.
- Left preview and zero-difference messaging out of scope because Phase 26 owns preview/auditoria/salvaguardas.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Stabilized foundation e2e cleanup**
- **Found during:** Task 3 (e2e flow coverage)
- **Issue:** Existing jsdom tests leaked mounted shells and Radix Sheet body locks between tests, causing duplicated buttons and hidden content.
- **Fix:** Added `cleanup()` in `afterEach`, cleared body scroll-lock attributes, and reused the route type from `src/app/routes`.
- **Files modified:** `tests/e2e/foundation-flow.spec.ts`
- **Verification:** `npm run test -- tests/e2e/foundation-flow.spec.ts` passes.
- **Committed in:** `ae610a0` and `6ada869`

**2. [Rule 1 - Bug] Waited for async launch creation in existing invoice navigation test**
- **Found during:** Task 3 (e2e flow coverage)
- **Issue:** The existing invoice-navigation test asserted invoice UI before the async launch submit closed the sheet and refreshed state.
- **Fix:** Added `waitFor` around the invoice assertion.
- **Files modified:** `tests/e2e/foundation-flow.spec.ts`
- **Verification:** `npm run test -- tests/e2e/foundation-flow.spec.ts` passes.
- **Committed in:** `6ada869`

---

**Total deviations:** 2 auto-fixed (2 Rule 1 bugs).
**Impact on plan:** Test-only stability fixes were necessary to verify the planned UI flow and reduced existing e2e flakiness without expanding product scope.

## Issues Encountered

- `npm run lint` remains blocked by pre-existing unrelated TypeScript errors:
  - `src/main.tsx`: missing `virtual:pwa-register` type declaration.
  - `tests/modules/schedule-management.test.ts`: existing account fixture objects missing `goalAmount`, plus an existing `monthKey` union typing error.

## Verification

- `npm run test -- tests/e2e/foundation-flow.spec.ts` - passed, 5 tests.
- `npm run test -- tests/modules/account-adjustments.service.test.ts` - passed, 9 tests.
- `npm run lint` - failed only on the pre-existing unrelated TypeScript errors listed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 24 is complete. The domain, API/runtime, and accounts UI paths now support account balance adjustments; Phase 25 can extend the same adjustment concept to credit-card invoices. Repository-wide lint still has the known unrelated baseline failures.

---
*Phase: 24-reajuste-de-saldo-em-conta*
*Completed: 2026-04-15*
