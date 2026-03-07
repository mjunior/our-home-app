---
phase: 16-fluxo-de-caixa-consolidado-por-fatura
plan: "01"
subsystem: api
tags: [invoices, due-obligations, cashflow, runtime]
requires: []
provides:
  - Contrato consolidado de fatura por cartao no mes de vencimento com metadados de vencimento.
  - Inclusao de instancias programadas de cartao no total consolidado.
  - Transporte do contrato consolidado no runtime/API.
affects: [phase-16-02, phase-16-03, phase-17-card-invoices-view]
tech-stack:
  added: []
  patterns: [consolidated-invoice-contract]
key-files:
  created: []
  modified:
    - src/modules/invoices/invoices.service.ts
    - src/server/vite-api.ts
    - src/app/foundation/runtime.ts
    - tests/modules/invoices.service.test.ts
key-decisions:
  - "Obrigacao consolidada passa a expor `dueDay` e `dueDate` por cartao."
  - "Consolidacao inclui itens programados de cartao no mes devido."
patterns-established:
  - "Extrato consome contrato de fatura sem reprocessar regra de vencimento"
requirements-completed: [CFI-02, CFI-03, CFI-04]
duration: 18min
completed: 2026-03-06
---

# Phase 16 Plan 01 Summary

**Contrato de obrigacoes de fatura foi consolidado por cartao/vencimento com metadados de data e total incluindo itens programados de cartao.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-06T22:05:00-03:00
- **Completed:** 2026-03-06T22:09:00-03:00
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- `getDueObligationsByMonth` agora retorna `dueDay` e `dueDate` por cartao.
- Total consolidado inclui despesas avulsas e instancias programadas no cartao para o mes de vencimento.
- Runtime/API alinhados com contrato consolidado para consumo direto do extrato.

## Task Commits

1. **Task 1: Evoluir agregacao de obrigacoes de fatura por vencimento** - `ebc6e56` (feat)
2. **Task 2: Expor contrato consolidado na API/runtime sem quebrar compatibilidade** - `befa0ad` (feat)

## Files Created/Modified
- `src/modules/invoices/invoices.service.ts` - consolidacao por vencimento com metadados e instancias programadas.
- `tests/modules/invoices.service.test.ts` - cobertura de metadados e mix avulso+programado.
- `src/server/vite-api.ts` - injecao de repositorio de agenda no service de invoices.
- `src/app/foundation/runtime.ts` - runtime local usando mesmo contrato consolidado.

## Decisions Made
- Consolidacao passa a ser orientada por mes de vencimento e nao por monthKey de origem no extrato.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` permanece com falha preexistente de tipagem PWA (`virtual:pwa-register`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Base de contrato pronta para finalizar filtro/origem `FATURA` e navegacao contextual no extrato (16-02/16-03).

---
*Phase: 16-fluxo-de-caixa-consolidado-por-fatura*
*Completed: 2026-03-06*
