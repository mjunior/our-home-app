# Phase 17: Tela de Cartao com Lista de Faturas e Drill-down - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar a experiencia de faturas dentro do modulo de cartoes: lista mensal consolidada por cartao e drill-down para despesas individuais com capacidade de edicao.

A fase continua mantendo o fluxo de caixa principal consolidado por fatura (sem reintroduzir compras individuais no extrato principal).

</domain>

<decisions>
## Implementation Decisions

### Modelo de navegacao
- Clique na linha `Fatura [Cartao]` no cashflow abre o modulo `Cartoes` com contexto de `cardId` e `dueMonth`.
- No modulo `Cartoes`, o contexto deve ser usado para abrir/realcar automaticamente a fatura alvo.

### Lista de faturas
- A tela de cartao deve exibir lista simples de faturas por mes com total consolidado.
- A lista pode combinar despesas avulsas de cartao e instancias programadas (recorrencia/parcela) por mes de vencimento.

### Drill-down de despesas
- Ao abrir uma fatura, usuario deve ver as despesas individuais vinculadas a ela.
- Itens devem preservar origem (`ONE_OFF`, `RECURRING`, `INSTALLMENT`) para decidir a acao de edicao.

### Edicao e recalc
- Edicao de item individual deve usar o fluxo de edicao ja existente (transacao avulsa ou agenda quando aplicavel).
- Total da fatura e linha consolidada no cashflow devem refletir alteracoes imediatamente apos salvar/excluir.

### Claude's Discretion
- Definir UX da selecao de cartao/fatura (layout simples com foco em legibilidade).
- Definir fallback quando contexto de navegacao chegar sem fatura correspondente.
- Definir niveis de acao permitidos por origem (ex.: instancias programadas podem redirecionar para edicao da regra).

</decisions>

<specifics>
## Specific Ideas

- Ja existe navegacao contextual do cashflow para cartoes via `app:navigate-route` e `cards:navigation-context`.
- Ja existe endpoint/base de dados para obrigacoes por mes (`/api/invoices/due`) e itens por cartao/mes (`/api/invoices/items`).
- Entrega desta fase deve consolidar UX de lista de faturas + drill-down completo com edicao operacional.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/foundation/cashflow/page.tsx`: gera linha sintetica de fatura e dispara navegacao contextual.
- `src/app/foundation/cards/page.tsx`: cadastro/edicao de cartao e bloco de contexto de fatura.
- `src/modules/invoices/invoices.service.ts`: agrega obrigacoes por mes e itens de fatura por cartao.
- `src/server/vite-api.ts` + `src/app/foundation/runtime.ts`: endpoints/runtime de invoices.
- `src/components/foundation/unified-launch-form.tsx`: fluxo atual de edicao de lancamentos.

### Established Patterns
- Lista operacional no app usa cards/tabela simples com badges de origem.
- Mutacoes de transacao e agendas ja possuem cobertura de update/delete e recalculo de totais.
- Navegacao entre modulos ocorre por evento no `AppShell`.

### Integration Points
- Adicionar listagem de faturas no modulo de cartoes consumindo contrato de invoices por mes.
- Conectar clique de item da fatura ao fluxo de edicao adequado por origem.
- Garantir regressao de recalculo no cashflow apos mutacao originada no contexto da fatura.

</code_context>

<deferred>
## Deferred Ideas

- Pagamento parcial/rotativo de fatura (v2).
- Conciliacao com extrato externo da operadora.

</deferred>

---

*Phase: 17-tela-de-cartao-com-lista-de-faturas-e-drill-down*
*Context gathered: 2026-03-07*
