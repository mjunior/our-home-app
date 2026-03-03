# Phase 10: Home UX Polish for Cashflow - Research

**Researched:** 2026-03-03
**Domain:** Cashflow home UX polish (header hierarchy, month navigation alignment, responsive statement rendering, compact date display)
**Confidence:** HIGH

## User Constraints

Constraints locked from `10-CONTEXT.md`:
- Titulo principal permanece `Fluxo de Caixa` com suporte de selo contextual acima.
- Subtitulo fixo e curto para estabilidade visual do header.
- Bloco direito do header mantem `badge` + botao `Novo lancamento` no desktop.
- Espacamento do topo deve ser compacto.
- Barra mensal desktop: navegacao de mes a esquerda e filtro `Origem` a direita.
- Barra mensal mobile quebra em duas linhas para evitar desalinhamento.
- Formato de mes visivel: `Mar/26`.
- Botoes de mes usam estilo `outline` suave.
- Desktop do extrato permanece tabela; mobile do extrato vira cards empilhados.
- Acao de edicao no extrato deve usar icone de lapis.
- Data da listagem em `DD/MM`; ano apenas quando necessario via tooltip.
- Ordenacao default: mais recente primeiro.
- Zebra leve nas linhas para legibilidade.

Deferred/out-of-scope:
- Importacao por textarea/csv-like (Phase 11).
- Novas capacidades analiticas/filtros fora dos existentes.

## Summary

Phase 10 should be implemented as a presentation-layer refinement on top of the current cashflow flow, preserving existing domain services and controllers. The current architecture already centralizes data assembly in `cashflow/page.tsx` and presentation in `statement-table.tsx`; the safest strategy is to split large JSX blocks into focused presentational components while keeping data contracts stable.

For the statement, the standard pattern is dual responsive rendering: semantic table for desktop and card list for mobile, both fed by the same normalized entry model. This avoids horizontal overflow and preserves scanability on small screens without creating divergent business logic.

**Primary recommendation:** implement Phase 10 in three slices: (1) header + month navigation layout contract, (2) responsive statement renderer (desktop table + mobile cards), (3) date/label formatting utilities (`DD/MM`, month label `MMM/YY`) with safe year tooltip behavior.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x (project) | Component composition and conditional responsive rendering | Already app foundation; no migration risk |
| Tailwind CSS | 3.4.x (project) | Responsive layout, spacing, alignment, visual density | Existing design token system already in place |
| shadcn-style UI primitives (`Card`, `Badge`, `Button`) | current project set | Visual consistency across dashboard and statement | Existing reusable primitives already adopted |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-variance-authority` | 0.7.x (project) | Variant consistency (buttons/badges/actions) | Keep action styles predictable across desktop/mobile |
| `lucide-react` | 0.576.x (project) | Pencil/edit icon and origin cues | Replace text action with icon affordance |
| `Intl.DateTimeFormat` + existing utils layer | native + project utils | `DD/MM` and `MMM/YY` formatting | No need for date library for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native date formatting in utils | `date-fns` formatting helpers | Adds dependency for a solved scope; unnecessary for phase goals |
| Table + cards with same model | Mobile table with horizontal scroll | Lower implementation effort but poor mobile readability |
| CSS-only one-layout compromise | Fully separate desktop/mobile components | Slightly more code, but clearer UX and easier testing |

**Installation:**
```bash
# No new dependencies required for Phase 10
```

## Architecture Patterns

### Pattern 1: Container + Presentational split in cashflow home
**What:** Keep data orchestration in `cashflow/page.tsx` and extract visual blocks to focused components (`CashflowHeader`, `MonthNavigator`, `StatementResponsive`).
**When to use:** Whenever visual structure changes but domain behavior remains identical.
**Example:**
```tsx
<CashflowHeader
  title="Fluxo de Caixa"
  subtitle="Dashboard limpo com sinal de risco e extrato do mes."
  monthLabel={monthLabel}
  onNewLaunch={() => setTransactionModalOpen(true)}
/>

<MonthNavigator
  monthLabel={monthLabel}
  onPrev={() => setMonth((prev) => addMonths(prev, -1))}
  onNext={() => setMonth((prev) => addMonths(prev, 1))}
  originFilter={originFilter}
  onOriginChange={setOriginFilter}
/>
```

### Pattern 2: Single source of truth for entries, dual renderer by breakpoint
**What:** Build `statementEntries` once and render via desktop table (`lg:block`) and mobile card list (`lg:hidden`).
**When to use:** Dense tabular data that must remain readable on small screens.
**Example:**
```tsx
<div className="hidden lg:block">
  <StatementDesktopTable entries={entries} ... />
</div>
<div className="lg:hidden">
  <StatementMobileCards entries={entries} ... />
</div>
```

### Pattern 3: Formatting facade in `src/lib/utils.ts`
**What:** Add explicit helpers for phase-specific display (`formatDateShortBR`, `formatMonthLabelBR`).
**When to use:** When same formatting rule appears in multiple UI areas.
**Example:**
```ts
export function formatDateShortBR(isoDateLike: string): string {
  const [year, month, day] = isoDateLike.slice(0, 10).split("-");
  if (!year || !month || !day) return isoDateLike;
  return `${day}/${month}`;
}
```

### Anti-Patterns to Avoid
- **Duplicating entry mapping logic per layout:** keep one normalized model and two render layers.
- **Formatting date inline in JSX:** use shared util to avoid drift.
- **Changing controller/domain contracts for a pure UX phase:** unnecessary regression risk.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Responsive state logic in JS | Custom window listeners and manual breakpoint state | Tailwind breakpoint visibility classes | Simpler, less bug-prone, already used in project |
| Action style permutations in-page | Ad-hoc class strings per button/icon | Existing `Button` variants + small icon button variant extension | Preserves design consistency |
| Date masking in each cell | Inline string slicing per component | Shared formatter helpers in `src/lib/utils.ts` | Centralized behavior and easier test coverage |
| Mobile list semantics | One-off markup disconnected from desktop model | Reuse `StatementEntry` type and shared label resolvers | Prevents behavior drift between layouts |

## Common Pitfalls

### Pitfall 1: Year removal causing ambiguity across year boundaries
- **What goes wrong:** `DD/MM` hides context when viewing months near virada de ano.
- **Avoid:** keep `DD/MM` as default and expose full date (`DD/MM/YYYY`) in tooltip/title attribute.

### Pitfall 2: Month controls reflowing unpredictably between breakpoints
- **What goes wrong:** misalignment persists because controls rely on implicit wrapping.
- **Avoid:** define explicit desktop and mobile flex/grid contracts for month controls and filter placement.

### Pitfall 3: Mobile statement cards losing quick action discoverability
- **What goes wrong:** replacing “Editar” text with icon without accessible label harms usability.
- **Avoid:** keep `aria-label` explicit (`Editar lancamento`) and touch target >= 40px.

### Pitfall 4: Visual improvements breaking e2e selectors
- **What goes wrong:** tests fail due changed text-only selectors.
- **Avoid:** prefer stable labels/roles and keep existing accessible names where possible.

## Code Examples

### Month label formatter (`Mar/26`)
```ts
export function formatMonthLabelBR(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  if (!year || !month) return monthKey;
  const date = new Date(Date.UTC(year, month - 1, 1));
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(date)
    .replace('.', '')
    .replace(' de ', '/');
}
```

### Date cell with short display + full tooltip
```tsx
<td title={formatDateBR(entry.occurredAt)}>
  {formatDateShortBR(entry.occurredAt)}
</td>
```

### Accessible icon-only edit action
```tsx
<Button
  type="button"
  variant="outline"
  size="icon"
  aria-label="Editar lancamento"
  onClick={() => onEditEntry(entry)}
>
  <Pencil className="h-4 w-4" />
</Button>
```

## Open Questions

1. Subtitulo final do header: manter texto atual exatamente ou ajustar microcopy para combinar com `Mar/26` no topo?
2. Em mobile cards, destino e categoria aparecem na mesma linha (compacto) ou em duas linhas (mais legivel)?
3. Ano no tooltip deve ser sempre visivel no hover/focus ou apenas quando mes exibido nao for o mes corrente?
