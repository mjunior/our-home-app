# Phase 4: Motor de Saldo Livre - Research

**Researched:** 2026-03-02
**Domain:** Free-balance projection engine for current + next month with explainable dashboard
**Confidence:** HIGH

## User Constraints

Constraints captured from `04-CONTEXT.md` and treated as locked for planning:
- Saldo livre deve considerar mês atual e impacto no próximo mês.
- Objetivo prático: indicar quanto ainda pode aumentar fatura de cartão sem negativar o próximo mês.
- Entram no cálculo: todas as saídas do mês, fatura de cartão e demais obrigações de saída do período.
- Investimentos ficam fora do saldo livre (mostrados separados no produto).
- Saldo livre pode ser negativo e deve gerar alerta explícito na UI.
- Ciclo de cartão é estrito por fechamento/vencimento.
- Despesa de cartão deve poder ser ajustada manualmente quando necessário.
- Projeção considera apenas obrigações cadastradas (sem margem automática).
- Recorrências devem sempre exigir dia específico.
- Despesa atrasada deve carregar para o mês seguinte.
- Dashboard deve destacar um semáforo principal e também permitir/mostrar detalhes.
- Breakdown obrigatório: saldo contas, fatura atual, fatura próxima, parcelas, recorrências, despesas avulsas.
- Exibir top 3 causas que mais puxam saldo livre para baixo.
- Alerta deve incluir sugestões de ação (tom claro, visual moderno).
- V1: horizonte de projeção em mês atual + próximo mês.
- Edição retroativa deve recalcular projeção imediatamente.
- Quando faltar cadastro de dados, ainda mostrar projeção com aviso de baixa confiabilidade e apontar o que está faltando.

Deferred (out of scope in phase 4):
- Projeção para 3, 4, 5, 6+ meses.
- Configuração de thresholds do semáforo por usuário/família.

## Summary

Phase 4 should introduce a dedicated free-balance module that consolidates three existing sources: account-targeted transactions, credit-card invoice projections, and generated scheduling obligations (installments/recurrences). The safest architecture is a deterministic service that returns a full explanation payload, not only a single number.

To satisfy explainability and negative-risk visibility, the output should include: totals by component, computed saldo livre for current/next month, an explicit confidence indicator, and a ranked list of top negative drivers. This enables the dashboard to present a primary semaphore plus actionable details without duplicating business logic in the UI.

**Primary recommendation:** Build formal calculation contracts first, then implement the engine service with unit tests, and finally integrate an explainable dashboard block with UI + e2e coverage.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.x | Free-balance contracts and calculation services | Existing project baseline |
| Decimal.js | 10.x | Precise money arithmetic for monthly projections | Already in dependencies; avoids drift |
| Zod | 3.x | Input validation for projection requests and overrides | Existing validation boundary pattern |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 2.x | Deterministic calculation tests + regression coverage | Service-level scenario testing |
| Testing Library + jsdom | current | Dashboard rendering and alert visibility checks | UI/e2e confidence on explainability |

## Architecture Patterns

### Pattern 1: Explainable aggregate response
- `FreeBalanceService` should return a single read-model:
  - `currentMonth`, `nextMonth`
  - `freeBalanceCurrent`, `freeBalanceNext`, `additionalCardSpendCapacity`
  - `breakdown` (accounts, card invoices, installments, recurrences, one-off expenses)
  - `topDrivers` (top 3 negative causes)
  - `risk` (`GREEN|YELLOW|RED`) + `alerts[]`
  - `confidence` (`HIGH|LOW`) + `missingData[]`

### Pattern 2: Cycle-strict card impact
- Use invoice cycle resolution from existing invoices module.
- New card expenses follow cycle rules automatically.
- Manual override path remains available for specific transaction correction.

### Pattern 3: Immediate recomputation on source mutation
- Projection is computed on read from latest repositories.
- No cached monthly snapshot in v1.
- Any edit in transactions/schedules immediately affects output.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Money totals | JS `number` sums | Existing money helpers + Decimal.js | Prevents precision regression |
| Card cycle logic | New cycle implementation | Reuse `InvoiceCycleService`/`InvoicesService` | Keep cycle strict and consistent |
| UI risk heuristics | Ad-hoc UI-only formula | Service-provided risk + suggestions | Single source of truth |

## Common Pitfalls

### Pitfall 1: Double counting card expenses
- **What goes wrong:** expense enters both monthly expense and invoice future burden.
- **Avoid:** establish explicit component boundaries in breakdown and tests.

### Pitfall 2: Missing-data false confidence
- **What goes wrong:** projection appears precise even with sparse cadastros.
- **Avoid:** return `confidence=LOW` and enumerate missing datasets/obligations.

### Pitfall 3: Hidden negative scenario
- **What goes wrong:** saldo livre negative appears only in detail view.
- **Avoid:** semaphore + visible red alert at top of dashboard block.

## Code Examples

### Additional card spend capacity (v1 concept)
```ts
const additionalCardSpendCapacity = freeBalanceNext;
```

### Top 3 negative drivers extraction
```ts
const topDrivers = components
  .filter((item) => item.impactSign === "NEGATIVE")
  .sort((a, b) => b.amountAbs.comparedTo(a.amountAbs))
  .slice(0, 3);
```

## Open Questions

1. **Default risk thresholds for semaphore in v1**
   - Decision now: define fixed defaults in code (non-configurable).
   - Future: promote to household configuration (deferred).

2. **Late expense carry-forward semantics**
   - Decision now: carry uncategorized late obligation into next-month component.
   - Validation target: cover with explicit service tests.
