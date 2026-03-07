# 17-01 Summary

## Resultado
- Contrato mensal de faturas exposto de forma explicita via `getMonthlyInvoices` no dominio de invoices.
- Endpoint HTTP adicionado: `GET /api/invoices/monthly?month=YYYY-MM`.
- Runtime frontend atualizado para consumir contrato mensal (`invoicesController.getMonthlyInvoices`).
- Contrato de itens da fatura enriquecido com metadados de origem para manutencao (`sourceId`, `monthKey`).

## Arquivos
- `src/modules/invoices/invoices.service.ts`
- `src/modules/invoices/invoices.controller.ts`
- `src/server/vite-api.ts`
- `src/app/foundation/runtime.ts`
- `tests/modules/invoices.service.test.ts`

## Verificacao
- `npm run test -- tests/modules/invoices.service.test.ts`
