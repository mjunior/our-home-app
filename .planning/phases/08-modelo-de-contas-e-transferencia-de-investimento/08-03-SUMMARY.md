---
phase: 08-modelo-de-contas-e-transferencia-de-investimento
plan: "03"
status: completed
updated: 2026-03-03
checkpoint: human-approved
---

## What Was Built
- Edicao e exclusao atomica de investimento no Cashflow, sempre mantendo debito+credito vinculados.
- Exclusao por linha de investimento tratada com fallback robusto (se houver grupo, remove o par inteiro).
- Fluxo de recorrencia/parcelamento corrigido para evitar falso sucesso em exclusao `CURRENT_AND_FUTURE` quando instancias estavam `locked`.

## Verification
- `npm run test -- tests/modules/transactions-api.test.ts tests/modules/schedule-management.test.ts` ✅
- `npm run test:e2e -- tests/e2e/cashflow-flow.spec.ts tests/e2e/schedules-flow.spec.ts tests/e2e/free-balance-dashboard.spec.ts` ✅
- Human checkpoint ✅ (`approved`)

## Notes
- Regra de saldo livre ajustada para refletir investimento como saida real no cashflow (sem compensar com entrada em conta investimento no consolidado principal).
