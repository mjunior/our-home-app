# Close Financial Month Design

## Goal

Add a simple `Fechar mes` reconciliation flow so the user can compare the app with real checking-account balances and real credit-card invoice totals, then create the necessary `REAJUSTE` entries before moving into the next month.

## Scope

The flow includes only:

- Checking accounts (`CHECKING`)
- Credit-card invoices due in the selected month

The flow excludes:

- Investment accounts
- Formal period locking
- Blocking edits in previous months
- Automatic bank/card sync

## Recommended Approach

Build a guided monthly reconciliation wizard that reuses the existing adjustment primitives:

- Account balance adjustment from Phase 24
- Credit-card invoice adjustment from Phase 25
- Preview, zero-difference, and audit safeguards from Phase 26

This gives the user a company-style closing ritual without introducing a separate accounting ledger yet.

## User Experience

On the Cashflow screen, the selected month gets a `Fechar mes` action near the month controls.

Clicking it opens a sheet with two sections:

1. `Contas correntes`
   - Lists each checking account.
   - Shows the app balance.
   - Lets the user enter the real end-of-month balance.

2. `Cartoes`
   - Lists each credit-card invoice due in that month.
   - Shows the app invoice total.
   - Lets the user enter the real invoice total.

Before saving, the sheet shows a preview row for each filled value:

- App value
- Real value
- Difference
- Whether a `REAJUSTE` will be created

Zero-difference rows clearly say no adjustment is needed and must not create transactions.

## Data Flow

Preview reads from existing sources:

- Checking balances from `accountsController.getConsolidatedBalance`
- Card invoices from `invoicesController.getDueObligationsByMonth`

Confirm applies existing adjustments:

- Checking account differences call account adjustment logic.
- Card invoice differences call credit-card invoice adjustment logic.
- Adjustments default to the last day of the selected month.
- The Cashflow page refreshes after confirm so `Mes atual` and projected values recalculate immediately.

## Error Handling

The sheet should validate money inputs before preview/confirm.

If a row has no user-entered real value, it is skipped.

If the user submits with no differences, the app shows a success/info message and creates no transactions.

If one adjustment fails, the UI should show an error and avoid pretending the whole month closed. The first implementation can apply all rows through one batch service so partial failure is avoided by validating all rows before writing.

## Testing

Automated coverage should prove:

- Only checking accounts appear in the close-month account list.
- Investment accounts are excluded.
- Credit-card invoices due in the selected month appear.
- Positive and negative account differences create paid account `REAJUSTE` transactions.
- Positive and negative card differences create card invoice `REAJUSTE` transactions.
- Zero differences create no transactions.
- Cashflow refreshes after confirm.

## Deferred

Do not implement true accounting locks yet. A later feature can add `closedMonth` records, edit warnings, or reopen behavior once the reconciliation flow proves useful.
