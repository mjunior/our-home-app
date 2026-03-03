---
phase: 07-fluxo-unico-de-lancamentos
plan: "02"
status: completed
updated: 2026-03-03
---

## What Was Built
- Novo `UnifiedLaunchForm` com tabs `Avulso`, `Recorrencia`, `Parcelamento` e categoria opcional.
- Cashflow virou ponto principal de criacao com CTA mobile fixo e acao desktop destacada.
- Tela de schedules foi reposicionada para gerenciamento/consulta, removendo duplicidade de criacao.

## Verification
- `npm run test:e2e -- tests/e2e/cashflow-flow.spec.ts tests/e2e/schedules-flow.spec.ts` ✅
- `npm run lint` ✅

## Notes
- Rotas/labels atualizadas para refletir foco no fluxo unico no Cashflow.
