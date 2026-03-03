# Phase 3: Parcelas e Recorrencias - Research

**Researched:** 2026-03-02
**Domain:** Scheduled financial obligations (installments + recurring transactions)
**Confidence:** HIGH

## User Constraints

No phase-specific CONTEXT.md was provided. Constraints inherited from PROJECT.md:
- Keep operations manual-first and explainable.
- Preserve simple daily UX with low cognitive overhead.
- Keep accounting immutable for closed periods when editing future schedules.

## Summary

Phase 3 should add a scheduling engine that materializes future transactions from two sources: installment purchases and recurring rules. The safest approach is to introduce explicit schedule entities and generated-instance records, rather than mutating single transactions repeatedly.

To satisfy auditability and safe editing, schedule revisions should be versioned by effective date and only affect future generated instances. Past generated entries must remain immutable so historical reports remain stable.

**Primary recommendation:** Implement schedule domain + generation service first, then add schedule management APIs/UI with edit/stop semantics that preserve past records.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Date handling (native UTC) | current | Cycle-safe generation windows | Existing code already uses ISO UTC |
| Zod | 3.x | Validate recurrence/installment definitions | Consistent boundary checks |
| Decimal.js | 10.x | Amount split and rounding for installments | Precise split totals |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 2.x | Schedule engine and mutation tests | Validate generation and edit rules |

## Architecture Patterns

### Pattern 1: Schedule definition + generated instances
- `RecurringRule` and `InstallmentPlan` define future obligation rules.
- `ScheduledTransaction` tracks generated materialized entries (with source reference).

### Pattern 2: Immutable past, mutable future
- Edits create new rule revision for `effectiveFrom` date.
- Generation skips existing instance keys to ensure idempotency.

### Pattern 3: Deterministic generation windows
- Generate by month key range (`YYYY-MM`) to support statement projections.
- Installments generate fixed number of instances with deterministic sequence index.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Installment value split | Float division in UI | Service-level decimal split helper | Prevent sum mismatch |
| Recurrence mutation | Update all generated rows in place | Revisioned rule updates | Protect historical integrity |
| Duplication guard | Manual scan in UI | Engine-level instance key idempotency | Safe re-generation |

## Common Pitfalls

### Pitfall 1: Editing recurring rule rewrites historical rows
- **What goes wrong:** previously closed month changes unexpectedly.
- **Avoid:** lock generated instances before `effectiveFrom`; only future rows can change.

### Pitfall 2: Installments not summing to original purchase amount
- **What goes wrong:** rounding leaves cent differences.
- **Avoid:** deterministic remainder distribution in final installment.

### Pitfall 3: Duplicate generation across repeated runs
- **What goes wrong:** same month gets duplicate entries.
- **Avoid:** composite `sourceType + sourceId + sequence + month` instance key.

## Code Examples

### Idempotent instance key
```ts
const instanceKey = `${sourceType}:${sourceId}:${sequence}:${monthKey}`;
```

### Safe recurrence edit boundary
```ts
if (instanceMonth < effectiveMonth) keepAsIs();
else regenerateWithNewRule();
```

## Open Questions

1. **Rule frequency scope in phase 3**
   - Known: monthly recurrence is required.
   - Recommendation: keep only monthly cadence now; defer weekly/custom frequencies.
