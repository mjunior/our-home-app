# Phase 10: Home UX Polish for Cashflow - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Melhorar a experiencia da tela inicial de Fluxo de Caixa removendo ruido visual, corrigindo alinhamento da navegacao mensal e elevando a legibilidade do extrato, sem adicionar novas capacidades funcionais.

</domain>

<decisions>
## Implementation Decisions

### Hierarquia do topo
- Titulo principal permanece `Fluxo de Caixa` com suporte de selo contextual acima (mobile-first financial cockpit).
- Subtitulo sera fixo e curto para estabilidade visual do header.
- Bloco da direita mantem `badge` + botao `Novo lancamento` no desktop, com alinhamento refinado.
- Espacamento vertical do topo sera compacto para acelerar escaneabilidade.

### Barra de navegacao mensal
- Desktop: botoes de mes + indicador de mes alinhados a esquerda e filtro `Origem` a direita.
- Mobile: barra quebra em duas linhas para evitar desalinhamento e colisao visual.
- Formato do mes visivel: `Mar/26`.
- Botoes de navegacao mensal usam estilo `outline` suave.

### Renderizacao do extrato
- Desktop mantem tabela (nao migra para cards), com refinamento de distribuicao das colunas.
- Mobile usa cards empilhados para leitura mais clara (sem scroll horizontal da tabela principal).
- Colunas desktop reduzem densidade visual; detalhes secundarios ficam em elementos de apoio.
- Acao de edicao muda para icone de lapis (substitui botao textual "Editar").

### Data e leitura da listagem
- Data padrao exibida como `DD/MM`.
- Quando ano for necessario, exibir em tooltip (nao poluir linha principal).
- Ordenacao padrao: mais recente primeiro.
- Linhas com zebra leve para melhorar rastreio horizontal de leitura.

### Claude's Discretion
- Definir copy final do subtitulo fixo para manter consistencia com o tom do app.
- Ajustar breakpoints exatos da troca tabela->cards no extrato.
- Definir como tooltip de ano sera exposto para acessibilidade (hover/focus/touch fallback).

</decisions>

<specifics>
## Specific Ideas

- Pedido explicito: remover duplicacao de titulo "Fluxo de Caixa" e manter cabecalho mais limpo.
- Pedido explicito: data do extrato nao deve exibir ano por padrao.
- Pedido explicito: botoes de navegacao mensal devem ficar alinhados corretamente.
- Preferencia definida: representacao de mes em linguagem curta (`Mar/26`) em vez de formato tecnico (`2026-03`).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/foundation/cashflow/page.tsx`: concentra header, barra mensal e integracao com extrato.
- `src/components/foundation/statement-table.tsx`: tabela atual com colunas e acao de edicao.
- `src/components/ui/button.tsx`: variantes (`outline`, `lime`, etc.) reutilizaveis para alinhar botoes de navegacao.
- `src/lib/utils.ts`: `formatDateBR` hoje retorna `DD/MM/YYYY` e deve ganhar suporte ao modo curto (`DD/MM`).

### Established Patterns
- Composicao por `Card` + `CardContent` para secoes do dashboard.
- Estilo tipografico e espacamentos centralizados em Tailwind + `src/styles.css`.
- Abordagem mobile-first ja consolidada desde a fase 4.1.

### Integration Points
- Header e barra de mes: ajustes diretos em `cashflow/page.tsx`.
- Extrato desktop/mobile: evolucao em `statement-table.tsx` com variacao responsiva.
- Data curta: utilitario em `src/lib/utils.ts` e consumo no extrato.

</code_context>

<deferred>
## Deferred Ideas

- Importacao por textarea/csv-like fica na Phase 11 (fora desta fase).
- Qualquer nova capacidade analitica/filtros adicionais fora dos existentes fica para fase posterior.

</deferred>

---
*Phase: 10-home-ux-polish-for-cashflow*
*Context gathered: 2026-03-03*
