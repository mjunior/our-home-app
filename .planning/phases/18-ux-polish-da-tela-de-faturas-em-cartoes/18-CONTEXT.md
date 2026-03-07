# Phase 18: UX polish da tela de faturas em cartoes - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Refinar a experiencia visual e de interacao da tela de faturas em `Cartoes`, preservando toda logica funcional implementada na fase 17.

Esta fase nao altera regras de competencia, consolidacao ou contratos de dominio de faturamento.

</domain>

<decisions>
## Implementation Decisions

### Direcao visual
- Melhorar hierarquia de informacao na lista de faturas (mes, cartao, total e estado selecionado).
- Dar mais destaque aos principais CTAs (abrir detalhe, editar/excluir item) com menor ruido visual.
- Manter compatibilidade com tema atual (claro/escuro) e componentes existentes.

### Fluxo de interacao
- Lista de faturas e detalhe devem coexistir sem duplicacao confusa de informacao.
- Edicao de item deve manter contexto evidente (qual cartao, qual mes, qual item).
- Acoes destrutivas devem ter copy e agrupamento mais claros.

### Estados e responsividade
- Tornar estados de vazio/erro/carregamento explicitos no modulo de cartoes.
- Otimizar leitura no mobile sem quebrar densidade de informacao no desktop.

### Claude's Discretion
- Escolher microcopy final de estados e labels de acao.
- Ajustar espaçamentos, tipografia e badge variants de forma incremental sem redesign total.

</decisions>

<specifics>
## Specific Ideas

- Evitar duplicacao de titulos e cards repetidos ao navegar por faturas.
- Aplicar layout de duas colunas no desktop (lista de faturas + detalhe) e empilhado no mobile.
- Melhorar feedback visual ao selecionar uma fatura.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/foundation/cards/page.tsx` concentra fluxo de lista de faturas, detalhe e edicao.
- `src/components/ui/*` ja oferece primitives suficientes para refino sem criar design system novo.
- `src/app/foundation/cashflow/page.tsx` deve permanecer apenas com consolidado e navegacao contextual.

### Integration Points
- Refino principal em `cards/page.tsx` e, se necessario, extração de subcomponentes para legibilidade.
- Cobertura e2e em `tests/e2e/foundation-flow.spec.ts` para validar UX essencial sem regressao funcional.

</code_context>

<deferred>
## Deferred Ideas

- Reestruturacao completa da arquitetura de componentes de cartoes.
- Animações sofisticadas e transições customizadas fora do padrão atual.

</deferred>

---

*Phase: 18-ux-polish-da-tela-de-faturas-em-cartoes*
*Context gathered: 2026-03-07*
