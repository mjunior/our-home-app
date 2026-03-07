# Phase 15: Motor de Competencia de Fatura por Fechamento - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Aplicar a regra de competencia de fatura de cartao por `closeDay` e `dueDay` configuraveis por cartao, garantindo classificacao correta das compras para o ciclo de fatura.

Nao inclui mudanca de exibicao no extrato principal (fase 16) nem UI completa de lista/detalhe de faturas (fase 17).

</domain>

<decisions>
## Implementation Decisions

### Regra de corte no fechamento (regra principal)
- Regra aprovada pelo usuario: compra com `day < closeDay` cai na fatura com vencimento no mesmo mes da compra (`dueDay`).
- Compra com `day >= closeDay` cai na fatura com vencimento no mes seguinte (`dueDay`).
- O dia de fechamento e **inclusivo para proxima fatura**.
- Exemplo de referencia do usuario (close=05, due=10):
  - 05/mar -> 10/abr
  - 06/mar -> 10/abr
  - 10/mar -> 10/abr
  - 01/abr -> 10/abr
  - 04/abr -> 10/abr
  - 05/abr -> 10/mai
  - 06/abr -> 10/mai

### Persistencia da competencia (fonte de verdade)
- Escolha do usuario: **Opcao A**.
- Persistir `invoiceMonthKey` e `invoiceDueDate` na transacao de cartao no momento da criacao/edicao.
- Leituras futuras devem priorizar esses campos persistidos, evitando recalculo dinamico como fonte primaria.

### Sem backfill agora
- Escolha do usuario: sem backfill nesta fase.
- Transacoes legadas sem `invoiceMonthKey` permanecem sem migracao massiva por enquanto.
- A fase 15 nao deve introduzir script de retro-processamento global.

### Edicao de parametros do cartao
- `closeDay` e `dueDay` devem poder ser alterados na edicao do cartao.
- Ao editar esses campos, a aplicacao deve refletir os novos valores no comportamento de calculo para novos lancamentos e para recalculo de itens ainda nao materializados como historico fechado.

### Claude's Discretion
- Definir politica tecnica exata para transacoes legadas sem backfill (fallback de leitura sem degradar consistencia).
- Definir estrategia de recalc apos edicao de `closeDay`/`dueDay` (escopo de aplicacao e limites) sem violar a regra principal aprovada.
- Definir pontos de validacao de dominio para impedir valores invalidos de dia (ex.: 0 ou >31).

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/modules/invoices/invoice-cycle.service.ts`: servico atual de resolucao de ciclo (`resolveExpenseCycle`) e base para ajustar regra de corte inclusiva.
- `src/modules/invoices/invoices.service.ts`: agrega despesas por fatura e ja consulta `invoiceMonthKey`/`invoiceDueDate` quando presentes.
- `src/modules/transactions/transactions.service.ts`: ponto principal para popular `invoiceMonthKey`/`invoiceDueDate` em create/update de transacao.
- `src/modules/cards/cards.service.ts` e `cards.repository.ts`: modelo atual de cartao com `closeDay`/`dueDay`.

### Established Patterns
- Hoje a regra usa comparacao estrita (`day > closeDay`) no cycle service; precisa alinhar para corte inclusivo conforme decisao do usuario.
- Transacoes de cartao hoje nascem com `invoiceMonthKey` e `invoiceDueDate` nulos em varios fluxos; fase 15 passa a exigir preenchimento.
- Ja existe contrato de cartao com `closeDay`/`dueDay` no backend e frontend, mas sem fluxo explicito de edicao persistente desses campos.

### Integration Points
- Backend API (`src/server/vite-api.ts`): ajustar create/edit de transacoes para persistir ciclo de fatura em despesas de cartao.
- Modulo de transacoes + invoices: unificar regra de competencia e evitar divergencia entre escrita e leitura.
- Modulo de cartoes: introduzir/ajustar endpoint e fluxo de edicao de `closeDay`/`dueDay`.
- Testes de dominio e e2e: cobrir exemplos reais de corte no dia de fechamento e impacto da edicao de parametros do cartao.

</code_context>

<specifics>
## Specific Ideas

- Usuario trouxe comportamento real do cartao como fonte de verdade para a regra.
- O produto deve ser previsivel para quem controla vencimento de fatura mensal.
- A persistencia de competencia foi explicitamente preferida para reduzir ambiguidades futuras.

</specifics>

<deferred>
## Deferred Ideas

- Backfill historico de todas as transacoes antigas de cartao ficou explicitamente adiado.
- Mudanca de exibicao no cashflow por fatura consolidada fica para fase 16.
- Lista e drill-down de faturas no modulo de cartoes fica para fase 17.

</deferred>

---

*Phase: 15-motor-de-competencia-de-fatura-por-fechamento*
*Context gathered: 2026-03-06*
