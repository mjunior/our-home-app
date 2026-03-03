---
phase: 07-fluxo-unico-de-lancamentos
plan: "03"
status: completed
updated: 2026-03-03
checkpoint: human-approved
---

## What Was Built
- Extrato com origem explicita por linha (`Avulso`, `Recorrente`, `Parcela`) e filtro por origem no Cashflow.
- Edicao direta no Cashflow para avulso/recorrencia/parcelamento, incluindo alteracao de tipo (`Entrada`/`Saida`).
- Exclusao direta no Cashflow com escopo configuravel para schedules: `atual + futuras` ou `todas (inclui antigas)`.

## Verification
- `npm run test:e2e -- tests/e2e/cashflow-flow.spec.ts tests/e2e/schedules-flow.spec.ts tests/e2e/free-balance-dashboard.spec.ts` ✅
- `npm run lint` ✅
- Human checkpoint ✅ (`approved`)

## Notes
- Ajuste incorporado apos feedback de UAT: edicao e exclusao de recorrencia/parcelamento movidas para o Cashflow.
