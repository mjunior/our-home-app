# Phase 9: Consolidados e Semantica Visual de Investimento - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Exibir investimento como saida separada de gasto operacional no panorama financeiro, consolidando corretamente saldos e relatorios sem dupla contagem, e definir semantica visual final para leitura rapida no Cashflow.

</domain>

<decisions>
## Implementation Decisions

### Resumo operacional do Cashflow
- Topo do Cashflow deve priorizar tres blocos: `Mes Atual | Proximo Mes | Gastos Mes`.
- Card `Pode aumentar no cartao` deve ser removido.
- Investimento deve continuar reduzindo o saldo livre (saida real), mas separado de gasto operacional na apresentacao.
- Navegacao mensal permanece como esta, com liberdade para melhorias de UI sem mudar o modelo de navegacao.

### Semantica visual de investimento (INV-04)
- Valor de investimento no extrato usa semantica neutra/teal, nunca vermelho de gasto comum.
- Investimento usa badge fixo `Investimento` com icone discreto.
- Investimento permanece em linha unica no extrato com `origem -> destino` explicito.
- Gasto operacional comum segue semantica vermelha de saida; investimento permanece visualmente separado.

### Consolidado por conta sem dupla contagem (ACC-03)
- Tela de contas deve priorizar card/listagem por conta com saldo individual claro.
- Transferencia interna de investimento nao altera total geral consolidado das contas, mas altera os saldos individuais de origem/destino.
- Cashflow permanece em visao operacional mensal para tomada de decisao (sem visao patrimonial ampla nesta fase).
- Cada conta deve exibir pelo menos tipo + saldo no resumo/listagem.

### Agregacao e linguagem dos relatorios operacionais
- Bloco `Gastos do mes` deve separar explicitamente `Gastos operacionais` e `Investimentos`.
- Nomenclatura final preferida: `Gastos operacionais`, `Investimentos`, `Total de saidas`.
- Filtro de extrato permanece completo: `Todos`, `Avulso`, `Recorrencia`, `Parcelamento`, `Investimento`.
- Navegacao mensal do cashflow permanece no padrao atual.

### Claude's Discretion
- Definir microcopy final e hierarquia tipografica dos tres blocos principais (`Mes Atual`, `Proximo Mes`, `Gastos Mes`) para melhorar escaneabilidade.
- Definir intensidade visual exata (tons, contraste, pesos) do estado de investimento para manter consistencia com o design system atual.

</decisions>

<specifics>
## Specific Ideas

- Diretriz explicita do usuario: visao operacional direta para decisao do mes, sem expandir para patrimonio completo nesta fase.
- Diretriz explicita do usuario: investimento deve aparecer separado de gasto operacional, sem perder impacto no saldo livre.
- Diretriz explicita do usuario: tela de contas enfatiza leitura por conta individual com total geral consistente.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/foundation/cashflow/page.tsx`: ponto principal para reorganizar blocos de resumo e separar visualmente gastos operacionais vs investimentos.
- `src/components/foundation/free-balance-semaphore.tsx`: base do topo operacional; local para remover card de capacidade de cartao e ajustar layout para os 3 blocos definidos.
- `src/components/foundation/statement-table.tsx`: ja possui semantica de investimento e vinculo origem->destino; evoluir semantica visual final.
- `src/app/foundation/accounts/page.tsx` e `src/components/foundation/consolidated-balance-card.tsx`: base para consolidado por conta e exibicao sem dupla contagem.

### Established Patterns
- Calculo operacional centralizado em `src/modules/free-balance/free-balance.service.ts`.
- Semantica de origem de lancamentos no extrato ja estruturada por `sourceType/sourceLabel`.
- Investimento vinculado por `transferGroupId` no dominio transacional (fase 8), pronto para agregacoes da fase 9.

### Integration Points
- `src/modules/free-balance/free-balance.types.ts` e `free-balance.service.ts`: ajustar componentes e agregacoes para expor `gastos operacionais`, `investimentos` e `total de saidas`.
- `src/server/vite-api.ts` e `src/app/foundation/runtime.ts`: propagar eventual novo payload agregado para a UI.
- `tests/e2e/free-balance-dashboard.spec.ts` e `tests/e2e/cashflow-flow.spec.ts`: proteger semantica visual e separacao contabil no fluxo operacional.

</code_context>

<deferred>
## Deferred Ideas

- Visao patrimonial completa multi-horizonte (alem da operacao mensal).
- Calendario financeiro completo para navegacao de meses (alem do padrao atual).
- Relatorios avancados de patrimonio/investimentos por classe de ativo.

</deferred>

---
*Phase: 09-consolidados-e-semantica-visual-de-investimento*
*Context gathered: 2026-03-03*
