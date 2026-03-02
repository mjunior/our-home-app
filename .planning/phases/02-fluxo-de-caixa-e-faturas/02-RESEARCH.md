# Phase 2: Fluxo de Caixa e Faturas - Research

**Researched:** 2026-03-02
**Domain:** Household cashflow ledger and credit-card billing cycle projection
**Confidence:** HIGH

## User Constraints

No phase-specific CONTEXT.md was provided. Using PROJECT.md constraints:
- Keep data entry manual-first.
- Preserve simple daily UX.
- Prioritize reliable financial math and explainable outputs.

## Summary

Phase 2 should introduce transaction-level ledger entries for both income and expense, with optional account or card linkage. Category assignment must happen at write-time so monthly statement queries can filter and aggregate without post-processing hacks.

For credit cards, the critical part is assigning each purchase to the correct invoice cycle based on close day and due day. The system should compute "current invoice" and "next invoice" totals from transaction dates and card cycle rules, not from UI heuristics.

**Primary recommendation:** Build a transaction module first, then invoice-cycle service, then monthly statement/read-model endpoints and UI bindings.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.x | Persist ledger + card cycle references | Already used in project |
| Zod | 3.x | Input schema validation | Boundary validation consistency |
| Decimal.js | 10.x | Money-safe totals and aggregations | Avoid rounding drift |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 2.x | Service and statement tests | Verify cycle and aggregation rules |

## Architecture Patterns

### Pattern 1: Transaction as single source of movement
- Every entry/exit is a Transaction with `kind` (`INCOME`/`EXPENSE`) and destination (`account` or `card`).
- Monthly statement and invoice totals are projections derived from transactions.

### Pattern 2: Card-cycle assignment service
- Encapsulate cycle logic in dedicated service (`invoice-cycle.service.ts`).
- Input: card close/due days + purchase date.
- Output: invoice month key + due date key.

### Pattern 3: Query-first reporting endpoints
- Build statement APIs with explicit filter DTO (month, account, card, category).
- Return deterministic totals and grouped views from same query path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Money totals | JS `number` accumulation | Decimal.js helpers | Prevent precision bugs |
| Validation | Inline endpoint checks | Shared zod DTO schemas | Reusable and testable |
| Date cycle parsing | Multiple ad-hoc functions | One invoice cycle service | Prevent inconsistent billing assignment |

## Common Pitfalls

### Pitfall 1: Expense linked to both account and card simultaneously
- **What goes wrong:** Double counting in statements.
- **How to avoid:** Enforce XOR validation: accountId XOR creditCardId.

### Pitfall 2: Invoice month misclassification around close day
- **What goes wrong:** Purchase appears in wrong invoice (current vs next).
- **How to avoid:** Centralize date rule in tested cycle service.

### Pitfall 3: Category not required at entry time
- **What goes wrong:** Monthly category statement becomes incomplete.
- **How to avoid:** Require categoryId for income/expense entries in phase scope.

## Code Examples

### XOR binding guard
```ts
if ((accountId && creditCardId) || (!accountId && !creditCardId)) {
  throw new Error("Transaction must target either account or card");
}
```

### Card cycle key
```ts
const cycleMonth = purchaseDay > closeDay ? addMonths(purchaseDate, 1) : purchaseDate;
```

## Open Questions

1. **Will transfer-between-accounts be introduced in phase 2?**
   - Known: not in current requirements list.
   - Recommendation: keep out of scope; represent only income/expense for now.
