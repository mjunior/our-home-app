---
phase: 15-motor-de-competencia-de-fatura-por-fechamento
plan: "02"
subsystem: api
tags: [transactions, invoices, persistence, prisma]
requires:
  - phase: 15-01
    provides: Regra de ciclo com fechamento inclusivo e vencimento por competencia
provides:
  - Persistencia de `invoiceMonthKey` e `invoiceDueDate` em escrita de despesa no cartao.
  - Recalculo de competencia no update de transacao de cartao.
  - Leitura de fatura priorizando campos materializados com fallback legado.
affects: [phase-15-03, phase-16-cashflow-invoice-projection]
tech-stack:
  added: []
  patterns: [materialized-invoice-cycle]
key-files:
  created: []
  modified:
    - src/modules/transactions/transactions.service.ts
    - src/server/vite-api.ts
    - src/modules/invoices/invoices.service.ts
    - tests/modules/transactions-api.test.ts
    - tests/modules/invoices.service.test.ts
key-decisions:
  - "Despesa de cartao passa a materializar ciclo no momento da escrita."
  - "Leitura de fatura usa campos persistidos como fonte primaria, mantendo fallback para legado sem backfill."
patterns-established:
  - "Regra de ciclo aplicada de forma centralizada na escrita antes de persistir transacao"
requirements-completed: [CCB-03, CCB-04]
duration: 22min
completed: 2026-03-06
---

# Phase 15 Plan 02 Summary

**Transacoes de cartao agora persistem competencia/vencimento na criacao e edicao, e a agregacao de faturas passou a confiar nesses campos materializados.**

## Performance

- **Duration:** 22 min
- **Started:** 2026-03-06T21:29:00-03:00
- **Completed:** 2026-03-06T21:31:00-03:00
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Escrita de transacao de cartao (service e API) persiste `invoiceMonthKey` e `invoiceDueDate`.
- Edição de despesa no cartao recalcula e atualiza ciclo persistido.
- Leitura de faturas prioriza ciclo persistido e preserva fallback para registros legados sem backfill.

## Task Commits

1. **Task 1: Persistir competencia da fatura em create/update de despesa no cartao** - `714d8a5` (feat)
2. **Task 2: Ajustar leitura para priorizar competencia persistida e validar contrato** - `3f1c941` (refactor)

## Files Created/Modified
- `src/modules/transactions/transactions.service.ts` - resolve e persiste ciclo na camada de dominio.
- `src/server/vite-api.ts` - aplica ciclo persistido nas rotas de create/edit e launch one-off.
- `src/modules/invoices/invoices.service.ts` - prioriza campos persistidos com fallback legado.
- `tests/modules/transactions-api.test.ts` - valida materializacao e recalculo no update.
- `tests/modules/invoices.service.test.ts` - valida prioridade de campos persistidos e fallback.

## Decisions Made
- Sem backfill nesta fase; somente novos writes e edits materializam ciclo.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` segue falhando por problema preexistente de tipagem PWA (`virtual:pwa-register` em `src/main.tsx`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Base pronta para permitir edição de `closeDay`/`dueDay` de cartão (15-03) sem migrar histórico.

---
*Phase: 15-motor-de-competencia-de-fatura-por-fechamento*
*Completed: 2026-03-06*
