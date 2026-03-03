---
phase: 08-modelo-de-contas-e-transferencia-de-investimento
plan: "01"
status: completed
updated: 2026-03-03
---

## What Was Built
- Tipagem de conta consolidada para `CHECKING` e `INVESTMENT` no dominio, repositorio, service e formulario de contas.
- Persistencia expandida com `transferGroupId` em transacoes para rastrear debito e credito do mesmo investimento.
- Contrato de investimento atomico implementado no dominio/API (`createInvestmentTransfer`, `updateInvestmentTransfer`, `deleteInvestmentTransfer`) com validacoes de origem/destino.

## Verification
- `npm run test -- tests/modules/transactions-api.test.ts tests/modules/schedule-management.test.ts tests/modules/foundation-api.test.ts` ✅
- `npm run lint` ✅

## Notes
- Script de banco ajustado para sempre regenerar Prisma Client no `db:push`, evitando client desatualizado em `dev`.
