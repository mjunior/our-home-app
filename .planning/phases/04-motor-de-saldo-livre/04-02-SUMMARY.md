---
phase: 04-motor-de-saldo-livre
plan: "02"
subsystem: api
tags: [invoices, integration, carry-forward]
requires:
  - phase: 04-01
    provides: free balance service contracts and risk policy
provides:
  - Due-month card obligations aggregation
  - Integration hooks for projection consistency across modules
  - Coverage for no-double-count invoice scenarios
affects: [cashflow-dashboard, verification-phase-04]
tech-stack:
  added: []
  patterns: [due-month obligation aggregation, cross-module projection consistency]
key-files:
  created: []
  modified:
    - src/modules/invoices/invoices.service.ts
    - src/modules/invoices/invoices.controller.ts
    - src/modules/scheduling/schedule-management.service.ts
    - tests/modules/invoices.service.test.ts
key-decisions:
  - "Card obligations are grouped by due month to align projection with payment month"
  - "Invoice aggregation excludes account expenses to prevent double counting"
patterns-established:
  - "Cross-module projection data is integrated via explicit service methods"
requirements-completed: [FREE-01, FREE-02, FREE-03]
duration: 12min
completed: 2026-03-02
---

# Phase 4: Projection Integration Summary

**Integração de projeção consolidada com faturas por mês de vencimento e proteção contra dupla contagem de despesas.**

## Performance
- **Duration:** 12 min
- **Started:** 2026-03-02T21:52:00Z
- **Completed:** 2026-03-02T22:04:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Adicionou `getDueObligationsByMonth` no módulo de faturas.
- Expos método no controller para consumo de projeções futuras.
- Incluiu cobertura de teste para vencimento de fatura sem dupla contagem.

## Task Commits
1. **Task 1: Integração de ciclo e obrigações por vencimento** - `8032ed9` (feat)
2. **Task 2: Ajustes de recomputação/carry-forward na integração** - `8032ed9` (feat)

**Plan metadata:** included in phase completion docs commit.

## Files Created/Modified
- `src/modules/invoices/invoices.service.ts`
- `src/modules/invoices/invoices.controller.ts`
- `src/modules/scheduling/schedule-management.service.ts`
- `tests/modules/invoices.service.test.ts`

## Decisions Made
- Vencimento da obrigação do cartão é sempre mapeado para `invoiceMonth + 1` no cálculo mensal.

## Deviations from Plan
None.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
Dashboard pode consumir risco e composição com consistência entre motor e faturas.

---
*Phase: 04-motor-de-saldo-livre*
*Completed: 2026-03-02*
