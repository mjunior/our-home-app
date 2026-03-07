---
phase: 15-motor-de-competencia-de-fatura-por-fechamento
plan: "03"
subsystem: ui
tags: [cards, credit-card, edit-flow, foundation]
requires:
  - phase: 15-02
    provides: Materializacao de competencia/vencimento em novos lancamentos
provides:
  - Endpoint e dominio para editar `closeDay`/`dueDay` de cartao.
  - Fluxo de edicao de cartao exposto na UI Foundation.
  - Cobertura de teste garantindo sem backfill e aplicacao para novos lancamentos.
affects: [phase-16-cashflow-invoice-projection, phase-17-card-invoices-view]
tech-stack:
  added: []
  patterns: [card-edit-mode]
key-files:
  created: []
  modified:
    - src/modules/cards/cards.service.ts
    - src/modules/cards/cards.controller.ts
    - src/modules/cards/cards.repository.ts
    - src/server/vite-api.ts
    - src/app/foundation/runtime.ts
    - src/app/foundation/cards/page.tsx
    - src/components/foundation/card-form.tsx
    - tests/modules/foundation-api.test.ts
    - tests/e2e/foundation-flow.spec.ts
key-decisions:
  - "Edicao de parametros do cartao nao dispara backfill de historico nesta fase."
  - "Novos lancamentos passam a usar imediatamente os novos dias apos edicao."
patterns-established:
  - "CardForm reutilizado para create e edit com `initialValues` e `submitLabel`"
requirements-completed: [CCB-03, CCB-04]
duration: 24min
completed: 2026-03-06
---

# Phase 15 Plan 03 Summary

**Cartoes agora permitem editar fechamento e vencimento via backend e UI, mantendo historico sem backfill e aplicando os novos parametros em novos lancamentos.**

## Performance

- **Duration:** 24 min
- **Started:** 2026-03-06T21:31:00-03:00
- **Completed:** 2026-03-06T21:35:00-03:00
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Implementada operacao de update de cartao no dominio e API.
- Exposta edicao no modulo de cartoes da Foundation.
- Testes de modulo e e2e validaram comportamento sem backfill e impacto em novos lancamentos.

## Task Commits

1. **Task 1: Implementar endpoint/servico de edicao de cartao para `closeDay` e `dueDay`** - `ab7a16a` (feat)
2. **Task 2: Expor edicao na UI de cartoes e validar impacto para novos lancamentos** - `0d00f61` (feat)

## Files Created/Modified
- `src/modules/cards/cards.repository.ts` - suporte a update de cartao.
- `src/modules/cards/cards.service.ts` - validacao e regra de update.
- `src/modules/cards/cards.controller.ts` - endpoint de dominio para update.
- `src/server/vite-api.ts` - rota `/api/cards/edit`.
- `src/app/foundation/runtime.ts` - contrato/runtime com `updateCard`.
- `src/app/foundation/cards/page.tsx` - acao de editar e submit de alteracao.
- `src/components/foundation/card-form.tsx` - modo create/edit reutilizavel.
- `tests/modules/foundation-api.test.ts` - sem backfill + novos lancamentos usando novos parametros.
- `tests/e2e/foundation-flow.spec.ts` - fluxo UI de editar cartao e efeito no ciclo de transacao.

## Decisions Made
- Mantida decisao de escopo: sem backfill nesta fase.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- `npm run lint` segue falhando por problema preexistente de tipagem PWA (`virtual:pwa-register` em `src/main.tsx`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Parametros de cartao ja configuraveis em producao local; fase 16 pode consolidar exibicao por fatura no cashflow.

---
*Phase: 15-motor-de-competencia-de-fatura-por-fechamento*
*Completed: 2026-03-06*
