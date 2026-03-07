---
phase: 20-quitacao-de-fatura-consolidada-de-cartao
plan: "02"
subsystem: api
tags: [api, runtime, invoices, settlement]
requires:
  - phase: 20-01
    provides: Modelo de quitacao de fatura persistido
provides:
  - Endpoints para marcar/desfazer quitacao de fatura.
  - Runtime frontend com operacoes de settle/unsettle.
  - Ajuste de saldo consolidado em conta com base em quitacoes.
affects: [phase-20-03, phase-21]
tech-stack:
  added: []
  patterns: [invoice-settle-endpoint]
key-files:
  created: []
  modified:
    - src/server/vite-api.ts
    - src/app/foundation/runtime.ts
    - src/modules/accounts/accounts.service.ts
key-decisions:
  - "Valor pago da fatura e snapshot no momento da quitacao."
patterns-established:
  - "API de quitacao desacoplada de create/update de transacao comum"
requirements-completed: [INVP-01, INVP-02, INVP-03]
duration: 25min
completed: 2026-03-08
---

# Phase 20 Plan 02 Summary

**A quitacao de fatura consolidada foi exposta por API/runtime com validacao de conta pagadora e persistencia de data/valor de pagamento.**

## Accomplishments
- Rotas `/api/invoices/settle` e `/api/invoices/unsettle` implementadas.
- Runtime passou a disponibilizar `invoicesController.settleInvoice/unsettleInvoice`.
- Consolidado de contas considera quitacoes de fatura pagas para saldo atual.

## Task Commits
1. **Task 1 + Task 2** - `1610559` (feat)

## Automated Verification
- `npm test -- tests/modules/invoices.service.test.ts` ✓
- `npm test -- tests/modules/foundation-api.test.ts` ✓
