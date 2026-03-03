---
phase: 07-fluxo-unico-de-lancamentos
plan: "01"
status: completed
updated: 2026-03-03
---

## What Was Built
- Contrato unificado de lancamento no dominio (`ONE_OFF`, `RECURRING`, `INSTALLMENT`) via `ScheduleManagementService.createUnifiedLaunch`.
- Controllers/runtime atualizados para expor criacao unificada e listagem mensal de instancias para o Cashflow.
- Regra future-only consolidada no backend para recorrencias e parcelamentos (edicao/encerramento sem corromper historico fechado).

## Verification
- `npm run test -- tests/modules/schedule-management.test.ts tests/modules/free-balance.service.test.ts` ✅
- `npm run lint` ✅

## Notes
- Inclui metodos de suporte para edicao e exclusao controlada de instancias/schedules no repositorio de agendamentos.
