---
phase: 08-modelo-de-contas-e-transferencia-de-investimento
plan: "02"
status: completed
updated: 2026-03-03
---

## What Was Built
- `UnifiedLaunchForm` ganhou aba `Investimento` com campos dedicados de origem/destino e sem seletor entrada/saida.
- Cashflow integrado ao fluxo de investimento e extrato passou a exibir investimento com vinculo de transferencia.
- Formulario de contas atualizado para exibir somente `Conta corrente` e `Conta investimento`.

## Verification
- `npm run test:e2e -- tests/e2e/foundation-flow.spec.ts tests/e2e/cashflow-flow.spec.ts` ✅
- `npm run lint` ✅

## Notes
- Extrato evoluiu para exibir investimento em linha unica no Cashflow (sem duplicar visualmente o par), mantendo vinculo origem -> destino.
