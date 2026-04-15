---
phase: 24-reajuste-de-saldo-em-conta
verified: 2026-04-15T20:11:01Z
status: human_needed
score: 12/12 must-haves verified
human_verification:
  - test: "Real-browser account adjustment flow"
    expected: "User can open the accounts screen, click `Reajustar` for a visible account, fill real balance/month/date, save, see success feedback, and see the account balance update to the informed real balance without layout overlap."
    why_human: "Visual layout, focus behavior, snackbar clarity, and real-browser form input behavior cannot be fully verified by static inspection or jsdom."
  - test: "Investment-account visual regression"
    expected: "Investment accounts still show both `Editar objetivo` and `Reajustar` actions without truncation/overlap on mobile and desktop, and objective editing still works."
    why_human: "The e2e test verifies objective behavior, but responsive visual overlap requires a browser viewport check."
---

# Phase 24: Reajuste de Saldo em Conta Verification Report

**Phase Goal:** Criar o fluxo de dominio/API/UI para reajustar uma conta a partir do saldo real informado pelo usuario.
**Verified:** 2026-04-15T20:11:01Z
**Status:** human_needed
**Re-verification:** No - initial verification

## Goal Achievement

Phase 24 achieved the domain, runtime/API, and UI implementation required for account balance adjustment. The remaining verification need is human/browser validation of the visual flow and responsive layout.

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Usuario informa um valor real de conta e o dominio calcula a diferenca contra o saldo atual do app. | VERIFIED | `AccountAdjustmentsService` reads the balance snapshot and computes `realBalance.minus(previousBalance)` in `src/modules/accounts/account-adjustments.service.ts:45`. |
| 2 | Diferenca positiva gera lancamento `REAJUSTE` de entrada na conta. | VERIFIED | Positive difference maps to `INCOME`, creates `description: "REAJUSTE"` and absolute amount in `src/modules/accounts/account-adjustments.service.ts:51`; covered by `tests/modules/account-adjustments.service.test.ts:94`. |
| 3 | Diferenca negativa gera lancamento `REAJUSTE` de saida na conta. | VERIFIED | Negative difference maps to `EXPENSE`, creates `REAJUSTE` with absolute amount in `src/modules/accounts/account-adjustments.service.ts:51`; covered by `tests/modules/account-adjustments.service.test.ts:129`. |
| 4 | Lancamento criado iguala o saldo consolidado da conta ao valor real informado. | VERIFIED | Balance rows are shared by snapshot and consolidated balance in `src/modules/accounts/accounts.service.ts:161` and `src/modules/accounts/accounts.service.ts:231`; runtime test asserts the account balance becomes `925.40` in `tests/modules/account-adjustments.service.test.ts:247`. |
| 5 | Conta de outro household nao pode ser reajustada. | VERIFIED | Snapshot rejects missing/cross-household accounts in `src/modules/accounts/accounts.service.ts:163`; test asserts no transactions are created in `tests/modules/account-adjustments.service.test.ts:185`. |
| 6 | Runtime local e runtime API oferecem o mesmo metodo para criar reajuste de conta. | VERIFIED | Contract includes `createAccountAdjustment` in `src/app/foundation/runtime.ts:30`; local runtime injects `AccountAdjustmentsService` in `src/app/foundation/runtime.ts:189`; API runtime posts to the endpoint in `src/app/foundation/runtime.ts:404`. |
| 7 | Endpoint autenticado usa sempre o household da sessao e ignora household enviado pelo cliente. | VERIFIED | API route validates account ownership against `authHouseholdId`, passes `authHouseholdId` to balance/category/transaction writes, and API runtime omits `householdId` from the request body in `src/server/vite-api.ts:859` and `src/app/foundation/runtime.ts:404`. |
| 8 | Reajuste criado via API/runtime atualiza o saldo consolidado da conta. | VERIFIED | Local runtime test creates an adjustment then asserts consolidated balance reflects the new real balance in `tests/modules/account-adjustments.service.test.ts:247`. API route uses the same persisted balance components as `/api/accounts/consolidated` in `src/server/vite-api.ts:401`. |
| 9 | Usuario consegue iniciar reajuste a partir de uma conta visivel na tela de contas. | VERIFIED | Account card exposes `onAdjustAccount` and per-account accessible button in `src/components/foundation/consolidated-balance-card.tsx:21`; accounts page wires it in `src/app/foundation/accounts/page.tsx:77`; e2e clicks it in `tests/e2e/foundation-flow.spec.ts:139`. |
| 10 | Usuario informa valor real, mes de competencia e data do reajuste. | VERIFIED | Sheet includes controlled inputs for `Valor real`, `Mes de competencia`, and `Data do reajuste` in `src/app/foundation/accounts/page.tsx:152`; e2e fills all three in `tests/e2e/foundation-flow.spec.ts:143`. |
| 11 | Ao salvar, a tela de contas atualiza o saldo para o valor real informado. | VERIFIED | Submit calls `accountsController.createAccountAdjustment`, increments `refreshKey`, and clears state in `src/app/foundation/accounts/page.tsx:129`; e2e asserts `R$ 650.00` after save in `tests/e2e/foundation-flow.spec.ts:151`. |
| 12 | A transacao criada fica paga e aparece no mes/data escolhidos. | VERIFIED | Service and API persist `settlementStatus: "PAID"` and selected `occurredAt` in `src/modules/accounts/account-adjustments.service.ts:62` and `src/server/vite-api.ts:898`; e2e lists April transactions and asserts paid `REAJUSTE` on `2026-04-15` in `tests/e2e/foundation-flow.spec.ts:153`. |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `src/modules/accounts/account-adjustments.service.ts` | Domain service to calculate and record account adjustment | VERIFIED | Substantive implementation validates month, checks account snapshot, computes signed difference, creates/reuses category, and creates paid transaction. |
| `src/modules/accounts/accounts.service.ts` | Reusable current balance snapshot per account | VERIFIED | `getAccountBalanceSnapshot` reuses the same account-balance row builder as `consolidatedBalance`. |
| `tests/modules/account-adjustments.service.test.ts` | Positive, negative, ownership, controller, runtime coverage | VERIFIED | 9 tests pass, including positive/negative adjustment, month mismatch, ownership, controller, and runtime facade. |
| `src/app/foundation/runtime.ts` | Frontend/runtime contract for `accountsController.createAccountAdjustment` | VERIFIED | Contract, local runtime, and API runtime all expose the method. |
| `src/server/vite-api.ts` | Authenticated `POST /api/accounts/adjustment` route | VERIFIED | Route validates session household ownership, month/date, persisted balance, category upsert, and transaction creation. |
| `src/components/foundation/consolidated-balance-card.tsx` | Per-account visual adjustment entry point | VERIFIED | Optional `onAdjustAccount` prop and `Reajustar saldo da [conta]` action exist per account. |
| `src/app/foundation/accounts/page.tsx` | Adjustment sheet/form and runtime call | VERIFIED | Sheet displays account/current balance, collects real balance/month/date, submits to runtime, refreshes on success, keeps sheet open on error. |
| `tests/e2e/foundation-flow.spec.ts` | User-flow coverage in jsdom | VERIFIED | Flow creates account, opens adjustment sheet, submits real balance, checks updated UI and paid `REAJUSTE` transaction. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `account-adjustments.service.ts` | `accounts.service.ts` | `getAccountBalanceSnapshot` | WIRED | Service fetches current app balance before calculating the difference. |
| `account-adjustments.service.ts` | `transactions.repository.ts` | `transactionsRepository.create` | WIRED | Creates `INCOME`/`EXPENSE` paid `REAJUSTE` transaction with absolute amount. |
| `account-adjustments.service.ts` | `categories.repository.ts` | `findByNormalized`/`create` | WIRED | Reuses or creates household-scoped `Reajuste` category. |
| `runtime.ts` | `/api/accounts/adjustment` | `requestSync("POST", ...)` | WIRED | API runtime sends only accountId, realBalance, month, and occurredAt. |
| `vite-api.ts` | Prisma account/transaction/category | ownership check, balance calc, upsert/create | WIRED | Route uses `authHouseholdId` for ownership, persisted balance, category upsert, and transaction create. |
| `runtime.ts` | `AccountAdjustmentsService` | local runtime constructor | WIRED | Local runtime shares accounts, transactions, categories, settlements, and schedules repositories. |
| `consolidated-balance-card.tsx` | `accounts/page.tsx` | `onAdjustAccount(account.id)` | WIRED | Card button calls callback; page passes `startAdjustment`. |
| `accounts/page.tsx` | `runtime.ts` | `accountsController.createAccountAdjustment` | WIRED | Submit calls runtime with selected account, converted real balance, month, and selected date. |
| `foundation-flow.spec.ts` | transaction repository/runtime | `transactionsController.listTransactionsByMonth` | WIRED | Test verifies created transaction is `REAJUSTE`, `INCOME`, paid, and dated in selected month. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| ACADJ-01 | 24-02, 24-03 | Usuario pode iniciar um reajuste para uma conta informando conta, valor real, data do lancamento e mes de competencia. | SATISFIED | Card action and sheet inputs in `src/components/foundation/consolidated-balance-card.tsx:79` and `src/app/foundation/accounts/page.tsx:152`; e2e covers full entry flow. |
| ACADJ-02 | 24-01, 24-02 | Sistema calcula a diferenca entre o saldo da conta no app e o valor real informado pelo usuario. | SATISFIED | Domain/API compute `realBalance - previousBalance` in `src/modules/accounts/account-adjustments.service.ts:49` and `src/server/vite-api.ts:879`. |
| ACADJ-03 | 24-01, 24-02 | Sistema cria um lancamento unico `REAJUSTE` positivo quando o valor real for maior que o saldo do app. | SATISFIED | Positive service test asserts `INCOME` `REAJUSTE` in `tests/modules/account-adjustments.service.test.ts:94`. |
| ACADJ-04 | 24-01, 24-02 | Sistema cria um lancamento unico `REAJUSTE` negativo quando o valor real for menor que o saldo do app. | SATISFIED | Negative service test asserts `EXPENSE` `REAJUSTE` in `tests/modules/account-adjustments.service.test.ts:129`. |
| ACADJ-05 | 24-01, 24-02, 24-03 | Reajuste de conta impacta saldo atual e saldo previsto de forma consistente com a data escolhida e o status operacional do lancamento. | SATISFIED | Transactions are `PAID`, dated by `occurredAt`, and consolidated balance updates in tests. Cashflow/free-balance predicted impact is through existing paid account transaction semantics. |
| ADJ-04 | 24-01, 24-02 | Sistema valida que conta/cartao, fatura e lancamento pertencem ao usuario autenticado antes de calcular ou gravar o reajuste. | SATISFIED | Domain rejects cross-household accounts before transaction creation; API route checks `account.householdId !== authHouseholdId` before balance/transaction work. |

No orphaned Phase 24 requirements found. REQUIREMENTS.md maps exactly ACADJ-01, ACADJ-02, ACADJ-03, ACADJ-04, ACADJ-05, and ADJ-04 to Phase 24, and all appear in plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| --- | --- | --- | --- | --- |
| `src/app/foundation/accounts/page.tsx` | 157 | Input placeholder example | Info | Normal form placeholder, not a stub or incomplete implementation. |
| `src/app/foundation/accounts/page.tsx` | 235 | Existing investment-goal input placeholder example | Info | Unrelated existing UI placeholder, not a Phase 24 gap. |

No blocker TODO/FIXME/stub/console-only implementation patterns were found in Phase 24 files.

### Human Verification Required

### 1. Real-browser account adjustment flow

**Test:** Open the app in a browser, go to Accounts, click `Reajustar` for a visible account, fill real balance, competence month, and adjustment date, then save.
**Expected:** Success feedback appears, the sheet closes, the account balance updates to the informed real balance, and no field/button text overlaps.
**Why human:** Visual layout, focus behavior, snackbar clarity, and native date/month input behavior need a browser viewport check.

### 2. Investment-account visual regression

**Test:** Use an `INVESTMENT` account with and without a goal on mobile and desktop widths.
**Expected:** `Editar objetivo` and `Reajustar` remain accessible and non-overlapping; investment goal editing still works.
**Why human:** jsdom verifies behavior but not responsive visual quality.

### Automated Verification

| Command | Result |
| --- | --- |
| `npm run test -- tests/modules/account-adjustments.service.test.ts tests/modules/foundation-api.test.ts` | PASS - 19 tests |
| `npm run test -- tests/e2e/foundation-flow.spec.ts` | PASS - 5 tests |
| `npm run lint` | FAIL - existing baseline errors outside Phase 24: missing `virtual:pwa-register` type in `src/main.tsx`, and existing `tests/modules/schedule-management.test.ts` fixture/union typing errors. |

### Gaps Summary

No implementation gaps found for Phase 24 must-haves or requirement coverage. The status is `human_needed` only because real-browser visual/user-flow checks remain outside reliable static/jsdom verification.

---

_Verified: 2026-04-15T20:11:01Z_
_Verifier: Claude (gsd-verifier)_
