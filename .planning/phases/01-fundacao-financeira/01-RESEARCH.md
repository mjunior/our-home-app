# Phase 1: Fundacao Financeira - Research

**Researched:** 2026-03-02
**Domain:** Home finance foundation (accounts, cards, categories, consolidated balance)
**Confidence:** HIGH

## User Constraints

No phase-specific CONTEXT.md was provided. Using locked constraints from PROJECT.md:
- Prioritize clear free-balance signal and trustworthy financial math.
- Start with manual entry flows first (no external financial integrations).
- Keep UX simple for daily household usage.

## Summary

Phase 1 should establish the canonical financial data model and CRUD surfaces for accounts, card setup, and categories. The key technical decision is maintaining one ledger source of truth in PostgreSQL with strict decimal handling, then exposing deterministic read models for consolidated balance.

The fastest reliable path is to create explicit entities for accounts, credit cards, categories, and transactions now, even if transaction workflows complete in Phase 2. This avoids schema churn and lets balance aggregation logic be implemented once and reused in upcoming phases.

**Primary recommendation:** Implement typed domain models first, then service-level validation and idempotent balance aggregation, then UI CRUD + consolidated balance read model.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | End-to-end typing | Reduces financial logic errors |
| PostgreSQL | 16+ | Source of truth for financial records | Reliable ACID behavior |
| Prisma | 6.x | Typed data access and migrations | Fast iteration with schema discipline |
| Decimal.js | 10.x | Exact decimal arithmetic | Avoids floating-point rounding errors |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zod | 3.x | Input validation at boundaries | Request DTO validation |
| Vitest | 2.x | Unit/integration tests | Domain/service-level checks |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma | Drizzle ORM | Drizzle gives SQL control; Prisma is faster for schema-first MVP |
| Vitest | Jest | Jest ecosystem is broader; Vitest is faster in TS-native setups |

**Installation:**
```bash
npm install prisma @prisma/client decimal.js zod
npm install -D vitest typescript
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── domain/           # Entities, value objects, domain rules
├── modules/          # accounts, cards, categories feature modules
├── services/         # balance aggregation and orchestration
└── shared/           # db client, validation, error helpers
```

### Pattern 1: Ledger-first modeling
**What:** Store durable financial entities and derive read models for UI.
**When to use:** Any place showing balances or summaries.
**Example:** Model `Account`, `CreditCard`, `Category`, `Transaction` with explicit ownership and status fields.

### Pattern 2: Decimal-safe calculations
**What:** Convert DB numeric values to decimal objects for arithmetic.
**When to use:** Consolidated balances and totals.
**Example:** Use Decimal.js in `computeConsolidatedBalance()` and round only at presentation.

### Anti-Patterns to Avoid
- **Float arithmetic for money:** introduces silent rounding drift.
- **Card bill date logic in UI:** keep cycle logic server-side for consistency.
- **Duplicated category naming rules across endpoints:** centralize validators.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decimal precision | Manual multiply/divide helpers | Decimal.js | Handles rounding and scale safely |
| Input schema validation | Ad hoc if/else validation | Zod schemas | Reusable and testable validation |
| Migration tracking | SQL file bookkeeping by hand | Prisma migrations | Safer and repeatable schema changes |

**Key insight:** Financial base phases fail mostly from subtle data consistency drift, not missing screens.

## Common Pitfalls

### Pitfall 1: Ambiguous account balance semantics
**What goes wrong:** "Current balance" means different things across screens.
**Why it happens:** No canonical definition documented in domain service.
**How to avoid:** Define and test one consolidated balance calculation contract.
**Warning signs:** Same period shows different totals between dashboard and account list.

### Pitfall 2: Card setup lacking billing-cycle fields
**What goes wrong:** Future invoice calculations become impossible.
**Why it happens:** Only storing card name/limit in v1.
**How to avoid:** Require close_day and due_day in Phase 1 schema.
**Warning signs:** Transaction has card_id but no cycle assignment strategy.

### Pitfall 3: Category duplication by casing/spaces
**What goes wrong:** Reports split "Mercado" and "mercado".
**Why it happens:** Missing normalization rule at create/update.
**How to avoid:** Normalize slug + enforce uniqueness per household.
**Warning signs:** near-duplicate categories in seed/local data.

## Code Examples

### Decimal-safe aggregated sum
```typescript
import Decimal from "decimal.js";

export function sumMoney(values: string[]): string {
  return values
    .reduce((acc, value) => acc.plus(new Decimal(value)), new Decimal(0))
    .toFixed(2);
}
```

### Category normalization
```typescript
export function normalizeCategoryName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Float math for money | Decimal-first domain services | Widely adopted in modern fintech stacks | Prevents drift in summaries |
| UI-owned business rules | Backend/domain-owned invariants | With typed fullstack architectures | More reliable cross-surface behavior |

**Deprecated/outdated:**
- Monetary arithmetic with JavaScript `number` for persisted finance calculations.

## Open Questions

1. **Single household vs multi-household ownership in schema now?**
   - What we know: current scope is one household context.
   - What's unclear: whether future collaboration arrives soon.
   - Recommendation: include `household_id` from day one to avoid table rewrites later.
