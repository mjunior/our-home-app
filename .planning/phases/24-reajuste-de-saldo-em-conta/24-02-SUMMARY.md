---
phase: 24-reajuste-de-saldo-em-conta
plan: "02"
subsystem: accounts
tags: [accounts, adjustments, runtime, vite-api, prisma, vitest]

requires:
  - phase: 24-01
    provides: servico de dominio, snapshot de saldo e contrato de controller para reajuste de conta
provides:
  - contrato de runtime para criar reajuste de conta
  - rota autenticada POST /api/accounts/adjustment
  - runtime de API conectado ao endpoint persistido sem enviar householdId do cliente
affects: [24-reajuste-de-saldo-em-conta, 25-reajuste-de-fatura-de-cartao, 26-preview-auditoria-e-salvaguardas-de-reajuste]

tech-stack:
  added: []
  patterns: [runtime facade compartilhando contrato local/API, endpoint autenticado derivando household da sessao]

key-files:
  created:
    - .planning/phases/24-reajuste-de-saldo-em-conta/24-02-SUMMARY.md
  modified:
    - src/app/foundation/runtime.ts
    - src/server/vite-api.ts
    - tests/modules/account-adjustments.service.test.ts
    - .planning/STATE.md
    - .planning/ROADMAP.md

key-decisions:
  - "Runtime de API omite householdId no payload de reajuste; o endpoint usa sempre o household da sessao."
  - "Endpoint persistido calcula saldo anterior com as mesmas fontes do consolidado: transacoes pagas, faturas quitadas e instancias pagas."
  - "Categoria Reajuste e criada/reutilizada via chave normalizada por household antes da transacao REAJUSTE."

patterns-established:
  - "Ajustes em runtime devem manter paridade entre facade local de teste e facade persistida de API."
  - "Endpoints autenticados de reajuste validam ownership antes de calcular diferencas ou gravar transacoes."

requirements-completed:
  - ACADJ-01
  - ACADJ-02
  - ACADJ-03
  - ACADJ-04
  - ACADJ-05
  - ADJ-04

duration: 3 min
completed: 2026-04-15
---

# Phase 24 Plan 02: Reajuste de Saldo em Conta Summary

**Account adjustment creation is now available through the runtime facade and authenticated Vite API, with persisted adjustments deriving household ownership from the active session.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-15T19:54:50Z
- **Completed:** 2026-04-15T19:57:25Z
- **Tasks:** 3
- **Files modified:** 3 implementation/test files plus planning metadata

## Accomplishments

- Added `createAccountAdjustment` to the runtime accounts contract and local test runtime.
- Added `POST /api/accounts/adjustment` with account ownership validation, month/date validation, consolidated-balance parity, category reuse/creation, and paid `REAJUSTE` transaction creation.
- Connected the API runtime facade to the new endpoint while excluding `householdId` from the client payload.
- Added runtime-level coverage proving an adjustment through the local facade updates consolidated balance.

## Task Commits

1. **Task 1 RED: Local runtime facade coverage** - `10c15f0` (test)
2. **Task 1 GREEN: Local runtime adjustment wiring** - `18fc682` (feat)
3. **Task 2: Persisted account adjustment endpoint** - `775b4b2` (feat)
4. **Task 3: API runtime endpoint call** - `09fea20` (feat)

**Plan metadata:** included in the docs completion commit

## Files Created/Modified

- `src/app/foundation/runtime.ts` - Extends the accounts runtime contract, wires local `AccountAdjustmentsService`, and posts API-runtime adjustments to `/api/accounts/adjustment`.
- `src/server/vite-api.ts` - Adds authenticated account-adjustment endpoint and persisted previous-balance calculation.
- `tests/modules/account-adjustments.service.test.ts` - Adds local runtime facade coverage for adjustment creation and consolidated balance update.
- `.planning/phases/24-reajuste-de-saldo-em-conta/24-02-SUMMARY.md` - Documents plan execution.

## Decisions Made

- Kept `householdId` out of the persisted runtime payload so session ownership remains the only source of truth.
- Calculated the API endpoint's previous balance from the same components used by `/api/accounts/consolidated`: paid account transactions, invoice settlements, and paid scheduled account instances.
- Used category upsert by `(householdId, normalized)` for `Reajuste` to avoid duplicate category races.

## Deviations from Plan

None - plan executed exactly as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** No scope change.

## Issues Encountered

- During Task 2 verification, `npm run lint` also reported the expected in-scope missing API-runtime method from Task 3. Task 3 resolved that in-scope error.
- `npm run lint` remains blocked by pre-existing unrelated TypeScript errors outside the owned files:
  - `src/main.tsx`: missing `virtual:pwa-register` type declaration.
  - `tests/e2e/foundation-flow.spec.ts`: route state type excludes `goals`.
  - `tests/modules/schedule-management.test.ts`: existing fixture and union typing issues.

## Verification

- `npm run test -- tests/modules/account-adjustments.service.test.ts tests/modules/foundation-api.test.ts` - passed, 19 tests.
- `npm run lint` - failed only on the pre-existing unrelated TypeScript errors listed above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Ready for `24-03`: runtime/API can create account adjustments from a single facade method, and the persisted path enforces session household isolation. Repository-wide lint still has the known unrelated baseline failures.

---
*Phase: 24-reajuste-de-saldo-em-conta*
*Completed: 2026-04-15*
