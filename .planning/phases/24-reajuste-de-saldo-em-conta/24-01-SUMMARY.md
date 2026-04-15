---
phase: 24-reajuste-de-saldo-em-conta
plan: "01"
subsystem: accounts
tags: [accounts, adjustments, balance, transactions, categories, vitest]

requires:
  - phase: 21
    provides: saldo atual consolidado por conta com movimentos pagos
provides:
  - servico de dominio para reajuste de saldo de conta
  - snapshot reutilizavel de saldo atual por conta
  - contrato de controller para criar reajuste de conta
affects: [24-reajuste-de-saldo-em-conta, 25-reajuste-de-fatura-de-cartao, 26-preview-auditoria-e-salvaguardas-de-reajuste]

tech-stack:
  added: []
  patterns: [servico de dominio com repositorios em memoria, testes TDD com Vitest]

key-files:
  created:
    - src/modules/accounts/account-adjustments.service.ts
    - tests/modules/account-adjustments.service.test.ts
  modified:
    - src/modules/accounts/accounts.service.ts
    - src/modules/accounts/accounts.controller.ts
    - src/modules/categories/categories.repository.ts

key-decisions:
  - "Reajuste de conta usa o mesmo calculo de saldo do consolidado via snapshot em AccountsService."
  - "Categoria sistemica Reajuste e criada ou reutilizada por household usando normalized=reajuste."
  - "Controller aceita AccountAdjustmentsService opcional para preservar compatibilidade dos testes e callers existentes."

patterns-established:
  - "Snapshot de saldo: validar ownership antes de retornar saldo calculado."
  - "Reajuste: calcular realBalance - previousBalance e gravar transacao PAID com description REAJUSTE."

requirements-completed:
  - ACADJ-02
  - ACADJ-03
  - ACADJ-04
  - ACADJ-05
  - ADJ-04

duration: 4 min
completed: 2026-04-15
---

# Phase 24 Plan 01: Reajuste de Saldo em Conta Summary

**Account balance adjustments now calculate the delta from the real balance and record paid `REAJUSTE` transactions against the selected account.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-15T19:47:28Z
- **Completed:** 2026-04-15T19:51:49Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Added `AccountsService.getAccountBalanceSnapshot` so adjustment logic uses the same paid transaction, settled invoice, and paid scheduled-instance rules as consolidated balance.
- Added `AccountAdjustmentsService` to validate account ownership/month, compute signed difference, reuse/create the `Reajuste` category, and create paid account transactions.
- Exposed `AccountsController.createAccountAdjustment` with an optional service dependency and a clear missing-service error.
- Added domain/controller coverage for positive adjustment, negative adjustment, month mismatch, ownership blocking, and controller delegation.

## Task Commits

1. **Task 1 RED: Snapshot tests** - `d102008` (test)
2. **Task 1 GREEN: Account balance snapshot** - `e6aa0e3` (feat)
3. **Task 2 RED: Adjustment service tests** - `8af4d47` (test)
4. **Task 2 GREEN: Adjustment service** - `78318dc` (feat)
5. **Task 3 RED: Controller tests** - `d97ee6e` (test)
6. **Task 3 GREEN: Controller contract** - `5f3fbaf` (feat)

## Files Created/Modified

- `src/modules/accounts/account-adjustments.service.ts` - Calculates account adjustment differences and creates paid `REAJUSTE` transactions.
- `src/modules/accounts/accounts.service.ts` - Adds individual account balance snapshot using the consolidated balance calculation path.
- `src/modules/accounts/accounts.controller.ts` - Adds account adjustment delegation contract.
- `src/modules/categories/categories.repository.ts` - Adds lookup by household and normalized category name.
- `tests/modules/account-adjustments.service.test.ts` - Covers snapshot, adjustment service, and controller behavior.

## Decisions Made

- Reused the consolidated account balance calculation for snapshots instead of maintaining a separate balance formula.
- Stored account adjustments as ordinary paid account transactions with `description: "REAJUSTE"` and no invoice/transfer metadata.
- Kept the controller adjustment service optional to avoid breaking existing tests and constructor call sites.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- `npm run lint` remains blocked by pre-existing unrelated TypeScript errors outside the owned files:
  - `src/main.tsx`: missing `virtual:pwa-register` type declaration.
  - `tests/e2e/foundation-flow.spec.ts`: route state type excludes `goals`.
  - `tests/modules/schedule-management.test.ts`: existing fixture and union typing issues.

## Verification

- `npm run test -- tests/modules/account-adjustments.service.test.ts` - passed, 8 tests.
- `npm run test -- tests/modules/foundation-api.test.ts` - passed, 10 tests.
- `npm run lint` - failed on pre-existing unrelated TypeScript errors listed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `24-02`: domain/service contract for account adjustment exists, including snapshot balance parity, transaction creation, and controller delegation. Remaining blocker is the repository-wide lint baseline, not this plan's implementation.

---
*Phase: 24-reajuste-de-saldo-em-conta*
*Completed: 2026-04-15*
