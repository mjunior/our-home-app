---
phase: 15-motor-de-competencia-de-fatura-por-fechamento
plan: "01"
subsystem: testing
tags: [invoices, billing-cycle, close-day, due-day]
requires: []
provides:
  - Regra de fechamento inclusiva no motor de ciclo de fatura.
  - Calculo de vencimento alinhado ao mes de competencia.
  - Testes de regressao com calendario real informado pelo usuario.
affects: [phase-15-02, phase-16-cashflow-invoice-projection]
tech-stack:
  added: []
  patterns: [table-driven-tests]
key-files:
  created: []
  modified:
    - src/modules/invoices/invoice-cycle.service.ts
    - tests/modules/invoice-cycle.service.test.ts
    - tests/modules/invoices.service.test.ts
key-decisions:
  - "Dia de fechamento passa a ser inclusivo para proxima competencia (day >= closeDay)."
  - "invoiceDueDate passa a refletir o proprio mes de competencia materializado."
patterns-established:
  - "Ciclo de cartao testado com cenarios de calendario real por tabela"
requirements-completed: [CCB-01, CCB-02]
duration: 25min
completed: 2026-03-06
---

# Phase 15 Plan 01 Summary

**Motor de ciclo de fatura agora aplica corte inclusivo no fechamento e reproduz o calendario real do cartao em testes automatizados.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-03-06T21:22:00-03:00
- **Completed:** 2026-03-06T21:29:00-03:00
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Regra do dia de fechamento alterada para inclusiva (`>=`).
- Data de vencimento calculada no mes da competencia resolvida.
- Cobertura com cenarios do usuario e regressao no service de faturas.

## Task Commits

1. **Task 1: Ajustar regra de corte inclusiva no InvoiceCycleService** - `e076f98` (fix)
2. **Task 2: Cobrir exemplos reais de fechamento/vencimento do usuario** - `58b111b` (test)

## Files Created/Modified
- `src/modules/invoices/invoice-cycle.service.ts` - regra inclusiva e vencimento por competencia.
- `tests/modules/invoice-cycle.service.test.ts` - casos de borda e calendario completo.
- `tests/modules/invoices.service.test.ts` - agregacao respeitando fechamento inclusivo.

## Decisions Made
- Aplicada interpretacao de competencia aprovada no contexto da fase (CCB-01/CCB-02).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` falhou por problema preexistente de tipagem PWA (`virtual:pwa-register` em `src/main.tsx`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Base de ciclo pronta para materializar `invoiceMonthKey` e `invoiceDueDate` na escrita de transacoes (15-02).

---
*Phase: 15-motor-de-competencia-de-fatura-por-fechamento*
*Completed: 2026-03-06*
