# 17-03 Summary

## Resultado
- Acoes de edicao/exclusao adicionadas no detalhe da fatura para itens `ONE_OFF`, `RECURRING` e `INSTALLMENT`.
- Fluxo de manutencao reaproveita os servicos existentes de transacao e agenda.
- Recalculo de total da fatura ocorre imediatamente apos mutacao no contexto de cartoes.
- Regressao e2e valida reflexo no cashflow apos editar item da fatura.

## Arquivos
- `src/app/foundation/cards/page.tsx`
- `tests/e2e/foundation-flow.spec.ts`
- `tests/e2e/cashflow-flow.spec.ts`
- `tests/modules/invoices.service.test.ts`

## Verificacao
- `npm run test -- tests/modules/invoices.service.test.ts tests/e2e/foundation-flow.spec.ts`
- `npm run test:e2e -- tests/e2e/foundation-flow.spec.ts tests/e2e/cashflow-flow.spec.ts`
