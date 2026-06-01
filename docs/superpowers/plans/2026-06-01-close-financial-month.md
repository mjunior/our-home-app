# Close Financial Month Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a simple close-month reconciliation flow for checking accounts and credit-card invoices.

**Architecture:** Reuse the existing account and card invoice adjustment services. Add a thin month-close orchestration layer that prepares previews, skips zero differences, applies adjustments in one confirm action, and refreshes Cashflow.

**Tech Stack:** React, TypeScript, Vite runtime controllers, existing in-memory/API runtime pattern, Vitest/jsdom tests, Decimal.js money calculations.

---

## File Structure

- Create: `src/modules/month-close/month-close.service.ts`
  - Builds preview rows and applies close-month adjustments.
  - Depends on `AccountsService`, `InvoicesService`, `AccountAdjustmentsService`, and `CreditCardAdjustmentsService`.

- Create: `src/modules/month-close/month-close.controller.ts`
  - Runtime-facing controller with `previewCloseMonth` and `confirmCloseMonth`.

- Modify: `src/modules/accounts/account-adjustments.service.ts`
  - Add zero-difference handling so no transaction is created when the real balance equals the app balance.

- Modify: `src/modules/invoices/credit-card-adjustments.service.ts`
  - Add zero-difference handling so no transaction is created when the real invoice total equals the app total.

- Modify: `src/app/foundation/runtime.ts`
  - Expose `monthCloseController` in local and API runtimes.

- Modify: `src/server/vite-api.ts`
  - Add authenticated month-close preview/confirm endpoints.

- Create: `src/components/foundation/month-close-sheet.tsx`
  - Sheet UI for entering real checking balances and real card invoice totals.

- Modify: `src/app/foundation/cashflow/page.tsx`
  - Add `Fechar mes` button, wire the sheet, and refresh state after confirm.

- Test: `tests/modules/month-close.service.test.ts`
  - Domain/service coverage.

- Test: `tests/e2e/free-balance-dashboard.spec.ts`
  - UI flow coverage from Cashflow.

---

## Tasks

### Task 1: Zero-Difference Safeguard

- [ ] Add failing tests proving account and card adjustment services do not create transactions when the difference is `0.00`.
- [ ] Update `AccountAdjustmentResult` and `CreditCardAdjustmentResult` so `transaction` can be `null`.
- [ ] Return the previous value, real value, `difference: "0.00"`, and `transaction: null` before writing.
- [ ] Run:

```bash
npm run test -- tests/modules/account-adjustments.service.test.ts tests/modules/credit-card-adjustments.service.test.ts
```

### Task 2: Month-Close Service

- [ ] Add `MonthCloseService`.
- [ ] `previewCloseMonth({ householdId, month, realAccountBalances, realCardInvoiceTotals })` must:
  - include only `CHECKING` accounts,
  - include card invoices due in `month`,
  - calculate signed differences,
  - mark zero rows as `willCreateAdjustment: false`.
- [ ] `confirmCloseMonth(...)` must validate the same preview first, then apply only rows with non-zero differences.
- [ ] Use the last day of `month` at noon UTC as the default adjustment date.
- [ ] Add service tests for checking-only filtering, card invoice rows, positive/negative differences, and zero skips.
- [ ] Run:

```bash
npm run test -- tests/modules/month-close.service.test.ts
```

### Task 3: Runtime and API

- [ ] Add `MonthCloseController`.
- [ ] Wire local runtime dependencies in `src/app/foundation/runtime.ts`.
- [ ] Add API runtime calls for preview and confirm.
- [ ] Add authenticated Vite API routes that use the session household and ignore any client-supplied household.
- [ ] Add API/runtime tests covering ownership and confirm behavior.
- [ ] Run:

```bash
npm run test -- tests/modules/foundation-api.test.ts tests/modules/month-close.service.test.ts
```

### Task 4: Cashflow UI

- [ ] Add `MonthCloseSheet`.
- [ ] Add `Fechar mes` action beside the Cashflow month controls.
- [ ] Populate the sheet from preview data.
- [ ] Let users enter real values per checking account and card invoice.
- [ ] Show app value, real value, difference, and zero-difference state before confirm.
- [ ] On confirm, call `monthCloseController.confirmCloseMonth`, close the sheet, notify success, and increment `refreshKey`.
- [ ] Run:

```bash
npm run test -- tests/e2e/free-balance-dashboard.spec.ts
```

### Task 5: Final Verification

- [ ] Run focused module and e2e tests:

```bash
npm run test -- tests/modules/account-adjustments.service.test.ts tests/modules/credit-card-adjustments.service.test.ts tests/modules/month-close.service.test.ts tests/modules/foundation-api.test.ts tests/e2e/free-balance-dashboard.spec.ts
```

- [ ] Run lint and record any pre-existing unrelated failures separately:

```bash
npm run lint
```

- [ ] Manually verify in browser that `Fechar mes` is understandable on mobile and desktop, and that the Cashflow values refresh after confirmation.
