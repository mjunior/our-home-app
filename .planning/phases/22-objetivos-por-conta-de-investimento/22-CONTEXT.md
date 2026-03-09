# Phase 22: Objetivos por Conta de Investimento - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning
**Source:** milestone v1.7 + leitura do codigo atual de contas/runtime/API

<domain>
## Phase Boundary

Adicionar `amount goal` opcional no nivel da conta `INVESTMENT`, persistindo esse dado sem alterar a logica contabil atual. A fase precisa cobrir criacao, leitura e edicao da meta, alem de exibir na tela de contas o progresso, percentual e quanto falta para atingir o objetivo.

Inclui runtime local, API com Prisma e UX minima necessaria para editar meta de conta ja existente. Nao inclui automacao de aportes, prazo-alvo nem metas multiplas.
</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- A meta existe no nivel da conta de investimento, nao em transacoes individuais.
- `amount goal` e opcional e so se aplica a contas `INVESTMENT`.
- A meta nao altera calculo de saldo atual, saldo previsto ou consolidado; e apenas contexto de acompanhamento.
- O progresso da meta deve usar o saldo atual calculado da propria conta como base.
- Quando a meta for atingida, o sistema nao deve exibir valor faltante negativo.
- O milestone precisa permitir editar a meta de uma conta de investimento existente, mesmo que a UI atual nao tenha edicao de conta.

### Claude's Discretion
- Escolher se a edicao da meta vira um fluxo dedicado para investimento ou um update mais geral de conta, desde que o escopo continue enxuto.
- Definir se o progresso aparece em barra, badge, copy textual ou combinacao, preservando a linguagem visual atual.
- Decidir se contas `CHECKING` escondem totalmente a meta ou exibem estado neutro sem CTA.
</decisions>

<specifics>
## Specific Ideas

- Estender `Account` em dominio/repositorio/API com campo opcional como `goalAmount`.
- Ajustar `accountsController.getConsolidatedBalance` para retornar metadados de meta por conta (`goalAmount`, `goalProgressPercent`, `remainingToGoal`, `goalReached`) sem mudar `amount` total.
- Atualizar `AccountForm` para mostrar campo de meta apenas quando `type === "INVESTMENT"`.
- Incluir na tela de contas uma acao simples de editar meta para conta investimento existente, reaproveitando `Sheet`/`Button` ja usados no modulo.
- Cobrir regressao em testes de modulo e e2e, incluindo caso de meta atingida e caso sem meta.
</specifics>

<deferred>
## Deferred Ideas

- Meta com prazo/data-alvo.
- Recomendacao automatica de aporte mensal.
- Multiplas metas por conta ou historico de objetivos.
- Alertas de proximidade/atingimento.
</deferred>

---

*Phase: 22-objetivos-por-conta-de-investimento*
*Context gathered: 2026-03-09*
