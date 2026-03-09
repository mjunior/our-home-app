# Phase 23: Feedback Operacional no Cashflow - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning
**Source:** milestone v1.7 + leitura do cashflow atual

<domain>
## Phase Boundary

Melhorar a clareza de interacao do cashflow em dois pontos de maior atrito operacional: troca de mes e cadastro de lancamentos. A fase cobre navegacao mensal com controles explicitos e estados visuais mais fortes, alem de feedback de clique/processamento no fluxo de `Novo lancamento`.

Inclui ajustes de UI, pequenos estados locais de submissao e cobertura de regressao em cashflow/dashboard. Nao inclui refactor geral do layout, nem padronizacao completa de loading para todos os formularios do produto.
</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- O cashflow deve ter controles explicitos de avancar/voltar mes alem do rail horizontal existente.
- A navegacao mensal precisa comunicar claramente hover, foco, ativo e clique/pressed.
- O fluxo de cadastro de lancamento deve mostrar processamento visual durante envio e bloquear submissao duplicada.
- As acoes principais do modal de lancamento devem parecer clicaveis sem fugir da linguagem visual atual do app.
- Melhorias devem continuar funcionando em mobile e desktop.

### Claude's Discretion
- Definir se os controles de avancar/voltar ficam junto do rail ou em um header proprio, desde que o resultado fique evidente.
- Escolher o tratamento de loading do submit (spinner, texto de envio, opacidade, barra) sem depender de infraestrutura assincrona real.
- Reforcar tabs e CTA do modal apenas onde isso melhora a leitura de interacao, evitando reestilizar todo o design system.
</decisions>

<specifics>
## Specific Ideas

- Adicionar botoes de mes anterior/proximo no bloco do rail, com `aria-label` explicita e estados visuais dedicados.
- Melhorar `.cashflow-month-rail__item` no CSS para feedback de hover/focus/active mais evidente.
- Introduzir estado `isSubmitting` no `UnifiedLaunchForm` e prop opcional de callback assinc/resultado no `CashflowPage`.
- Trocar copy do botao principal durante envio (`Salvando...`) e desabilitar tabs/submit durante processamento.
- Cobrir navegacao pelos novos botoes e submit bloqueando duplo clique nos testes e2e do cashflow.
</specifics>

<deferred>
## Deferred Ideas

- Padronizacao global de loading para todos os formularios.
- Feedback visual detalhado no fluxo de importacao por texto.
- Atalhos de teclado para navegar entre meses.
- Animacoes complexas ou redesign estrutural do dashboard.
</deferred>

---

*Phase: 23-feedback-operacional-no-cashflow*
*Context gathered: 2026-03-09*
