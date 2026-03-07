# Phase 16: Fluxo de Caixa Consolidado por Fatura - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Tornar o extrato principal do cashflow operacional por obrigacao de pagamento, exibindo faturas consolidadas por cartao no lugar de compras individuais de cartao.

Esta fase nao inclui drill-down completo da fatura com lista/edicao de despesas individuais no modulo de cartoes (fica para fase 17).

</domain>

<decisions>
## Implementation Decisions

### Linha consolidada no extrato
- Formato do rotulo no extrato: `Fatura [Cartao]` com nome curto (ex.: `Fatura C6`).
- A linha consolidada deve ser tratada como item sintetico de extrato (nao uma transacao avulsa editavel diretamente).
- Ordenacao no extrato deve usar o dia de vencimento (`dueDay`) do cartao no mes exibido.

### Interacao com a linha de fatura
- Ao tentar editar/interagir com a linha sintetica de fatura, o fluxo deve redirecionar para a tela de cartoes no contexto daquele cartao/mes de fatura.
- O extrato principal nao deve abrir edicao direta de despesas individuais de cartao nesta fase.

### Filtro de origem
- O filtro `Origem` deve incluir uma opcao explicita para `Fatura`.
- A origem `Fatura` representa apenas linhas consolidadas de obrigacao de cartao.

### Escopo do total consolidado
- O total da fatura consolidada deve incluir tudo que vence no mes para o cartao:
  - compras avulsas no cartao;
  - recorrencias no cartao;
  - parcelas no cartao.
- O total consolidado nao deve incluir despesas de conta corrente.

### Claude's Discretion
- Definir copy exata do aviso/interacao transitoria antes do redirecionamento (se houver).
- Definir fallback de UX quando cartao/mes alvo nao existir mais no momento do clique.
- Definir detalhes visuais do badge/semantica da origem `Fatura` mantendo consistencia com o design existente.

</decisions>

<specifics>
## Specific Ideas

- Usuario aprovou formato curto para linha de fatura (`Fatura C6`).
- Usuario quer navegacao direta para cartoes ao interagir com a linha de fatura, em vez de modal informativo.
- Usuario aprovou explicitamente `Fatura` como origem filtravel no extrato.
- Usuario confirmou consolidacao total por vencimento incluindo avulso + recorrente + parcela no cartao.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/foundation/cashflow/page.tsx`: monta `statementEntries`, filtro de origem e extrato principal; ponto central para consolidacao de fatura.
- `src/components/foundation/statement-table.tsx`: renderizacao da tabela/cards e acao de edicao por linha.
- `src/modules/invoices/invoices.service.ts`: `getDueObligationsByMonth` agrega despesas de cartao por mes de vencimento.
- `src/modules/free-balance/free-balance.service.ts`: usa `invoiceDueDate` para componente `cardInvoiceDue` no mes correto.
- `src/server/vite-api.ts` + `src/app/foundation/runtime.ts`: endpoint/runtime de `GET /api/invoices/due` para alimentar linhas consolidadas no extrato.

### Established Patterns
- Extrato principal e mobile cards compartilham modelo `StatementEntry` com `sourceType` para semantica de origem.
- Fase 15 materializou `invoiceMonthKey` + `invoiceDueDate` na escrita de despesas de cartao e definiu fallback legado sem backfill.
- Fluxos de UI de cashflow usam `useMemo` para compor dados de leitura e filtros por origem.

### Integration Points
- Adicionar `FATURA` no seletor `Origem` e no tipo aceito pelo estado de filtro em `cashflow/page.tsx`.
- Ajustar interacao da linha sintetica para navegacao contextual a cartoes (com parametros de cartao/mes).
- Garantir que linhas individuais de cartao fiquem fora do extrato principal em todos os caminhos (avulso, recorrente, parcela), mantendo o total consolidado correto.

</code_context>

<deferred>
## Deferred Ideas

- Drill-down completo da fatura com lista de despesas individuais e edicao inline permanece na fase 17.
- Qualquer comportamento de pagamento parcial/rotativo de fatura fica para requisitos v2.

</deferred>

---

*Phase: 16-fluxo-de-caixa-consolidado-por-fatura*
*Context gathered: 2026-03-06*
