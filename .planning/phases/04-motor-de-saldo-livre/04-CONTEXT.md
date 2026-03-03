# Phase 4: Motor de Saldo Livre - Context

**Gathered:** 2026-03-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Entregar o motor de saldo livre para mês atual e próximo mês, com cálculo confiável, projeção explícita e explicabilidade visual suficiente para decisão diária de gasto sem entrar no negativo.

</domain>

<decisions>
## Implementation Decisions

### Definição de saldo livre
- Saldo livre deve considerar mês atual e impacto no próximo mês.
- Objetivo prático: indicar quanto ainda pode aumentar fatura de cartão sem negativar o próximo mês.
- Entram no cálculo: todas as saídas do mês, fatura de cartão e demais obrigações de saída do período.
- Investimentos ficam fora do saldo livre (mostrados separados no produto).
- Saldo livre pode ser negativo e deve gerar alerta explícito na UI.

### Datas-limite e obrigações
- Ciclo de cartão é estrito por fechamento/vencimento.
- Despesa de cartão deve poder ser ajustada manualmente quando necessário.
- Projeção considera apenas obrigações cadastradas (sem margem automática).
- Recorrências devem sempre exigir dia específico.
- Despesa atrasada deve carregar para o mês seguinte.

### Explicabilidade e UX do dashboard
- Dashboard deve destacar um semáforo principal e também permitir/mostrar detalhes.
- Breakdown obrigatório: saldo contas, fatura atual, fatura próxima, parcelas, recorrências, despesas avulsas.
- Exibir top 3 causas que mais puxam saldo livre para baixo.
- Alerta deve incluir sugestões de ação (tom claro, visual moderno).

### Modelo de projeção
- V1: horizonte de projeção em mês atual + próximo mês.
- Edição retroativa deve recalcular projeção imediatamente.
- Semáforo configurável é desejável, mas não é must-have da fase.
- Quando faltar cadastro de dados, ainda mostrar projeção com aviso de baixa confiabilidade e apontar o que está faltando.

### Claude's Discretion
- Definir padrão de mercado para comportamento exato de despesas atrasadas carregadas.
- Definir thresholds padrão do semáforo para v1 (com opção de futura configuração).
- Definir layout final do componente de alerta/sugestão mantendo consistência visual do app.

</decisions>

<specifics>
## Specific Ideas

- Exemplo de referência funcional do usuário: "se eu gastar +R$300 no crédito neste mês e a próxima fatura ficar R$900, o sistema deve sinalizar se o próximo mês ficará negativo com base nas entradas/saídas já cadastradas".
- Prioridade explícita: usar saldo livre como indicador central de tomada de decisão no dashboard.
- Alertas devem ser "legais, bonitos e modernos".

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/modules/transactions/*`: base de entradas/saídas com validações de vínculo conta/cartão/categoria.
- `src/modules/invoices/*`: projeção de fatura atual/próxima por cartão e resumo mensal.
- `src/modules/scheduling/*`: recorrências e parcelas materializadas (inclui edição future-only).
- `src/app/foundation/cashflow/page.tsx`: tela consolidada de extrato e fatura para integração do motor.
- `src/components/foundation/invoice-panels.tsx` e `statement-table.tsx`: blocos reutilizáveis/expansíveis para explicabilidade.

### Established Patterns
- Regras de negócio centralizadas em services por módulo (`*.service.ts`) e controller fino (`*.controller.ts`).
- Persistência atual em repositórios in-memory com contrato explícito por módulo.
- Testes de módulo + e2e em Vitest com jsdom para validar fluxos críticos.

### Integration Points
- Novo módulo de saldo livre deve consumir transações, faturas e instâncias de schedule para montar cálculo consolidado.
- Dashboard/foundation deve incluir painel principal de saldo livre + alertas + breakdown sem quebrar fluxo atual de cashflow.
- Recalcular projeção em toda mutação relevante (lançamento, edição retroativa, alteração de schedule).

</code_context>

<deferred>
## Deferred Ideas

- Projeção para 3, 4, 5, 6+ meses (expandir após v1).
- Configuração de thresholds do semáforo por usuário/família (desejável, mas não obrigatório nesta fase).

</deferred>

---
*Phase: 04-motor-de-saldo-livre*
*Context gathered: 2026-03-02*
