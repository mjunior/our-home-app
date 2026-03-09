---
phase: 22-objetivos-por-conta-de-investimento
plan: "02"
subsystem: accounts-api-ui
tags: [accounts, api, runtime, foundation-ui]
requires:
  - phase: 22-01
    provides: goalAmount persistido no dominio de contas
provides:
  - Fluxo de criacao e edicao de meta no modulo de contas.
  - Contratos HTTP/runtime para criar e atualizar objetivo de conta investimento.
affects: []
tech-stack:
  added: []
  patterns: [investment-goal-edit-sheet]
key-files:
  created: []
  modified:
    - src/server/vite-api.ts
    - src/app/foundation/runtime.ts
    - src/app/foundation/accounts/page.tsx
    - src/components/foundation/account-form.tsx
key-decisions:
  - "Edicao de meta existente usa fluxo dedicado em Sheet, em vez de um editor geral de conta."
  - "Backend HTTP valida meta invalida e restringe update a contas de investimento."
patterns-established:
  - "Sheet dedicado para editar goalAmount de conta investimento"
requirements-completed: [INVG-01, INVG-02, INVG-04]
duration: 40min
completed: 2026-03-09
---

# Phase 22 Plan 02 Summary

**A meta de investimento foi conectada de ponta a ponta entre formulario, runtime local e API persistida.**

## Accomplishments
- `POST /api/accounts` e `POST /api/accounts/edit` agora aceitam/atualizam `goalAmount` com validacao de entrada.
- Runtime expoe `updateAccountGoal`, mantendo compatibilidade entre modo local e modo API.
- Tela de contas ganhou fluxo de edicao de objetivo e o formulario de criacao passou a mostrar o campo de meta apenas para contas de investimento.

## Task Commits
1. **Task 1 + Task 2** - pending manual commit aggregation in this session

## Automated Verification
- `npm run test -- tests/e2e/foundation-flow.spec.ts tests/modules/auth-api.test.ts tests/modules/foundation-api.test.ts` not run - `node`/`npm` indisponiveis no PATH deste ambiente
