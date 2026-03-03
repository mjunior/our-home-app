# Roadmap: Nosso Lar Financeiro

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Lancamentos Unificados e Investimento por Transferencia** — Phases 7-9 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.1-ROADMAP.md`
- 🚧 **v1.2 Ui improvements and Import** — Phases 10-11 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP Finance Core (Phases 1-4.2) — SHIPPED 2026-03-03</summary>

- [x] Phase 1: Fundacao Financeira (3/3 plans)
- [x] Phase 2: Fluxo de Caixa e Faturas (3/3 plans)
- [x] Phase 3: Parcelas e Recorrencias (2/2 plans)
- [x] Phase 4: Motor de Saldo Livre (3/3 plans)
- [x] Phase 4.1: UI revamp mobile-first com shadcn (3/3 plans)
- [x] Phase 4.2: database persist (3/3 plans)

Arquivo detalhado: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Lancamentos Unificados e Investimento por Transferencia (Phases 7-9) — SHIPPED 2026-03-03</summary>

- [x] Phase 7: Fluxo Unico de Lancamentos (3/3 plans)
- [x] Phase 8: Modelo de Contas e Transferencia de Investimento (3/3 plans)
- [x] Phase 9: Consolidados e Semantica Visual de Investimento (2/2 plans)

Arquivo detalhado: `.planning/milestones/v1.1-ROADMAP.md`

</details>

### 🚧 v1.2 Ui improvements and Import

- [x] **Phase 10: Home UX Polish for Cashflow** - Corrigir redundancias visuais e elevar legibilidade/consistencia da tela inicial de Fluxo de Caixa. (completed 2026-03-03)
- [ ] **Phase 11: Importacao de Lancamentos por Texto** - Entregar fluxo de import em lote via textarea com parsing, validacao e criacao dos lancamentos.

## Phase Details

### Phase 10: Home UX Polish for Cashflow
**Goal**: Melhorar experiencia da tela inicial eliminando ruido visual e corrigindo problemas de alinhamento e leitura no extrato.
**Depends on**: Phase 9
**Requirements**: UI-01, UI-02, UI-03, UI-04
**Success Criteria** (what must be TRUE):
1. User can ver apenas um titulo principal "Fluxo de Caixa" sem repeticao de heading.
2. User can usar botoes de mes anterior/proximo mes com alinhamento correto em mobile e desktop.
3. User can ler a tabela do extrato com melhor distribuicao visual de colunas e dados.
4. Datas do extrato aparecem como `DD/MM` por padrao sem ano na listagem.
**Plans**: 3 plans

Plans:
- [x] 10-01: Revisar cabecalho e hierarquia visual da home (completed 2026-03-03)
- [x] 10-02: Ajustar barra de navegacao mensal e responsividade (completed 2026-03-03)
- [x] 10-03: Refinar tabela do extrato e formato de data (completed 2026-03-03)

### Phase 11: Importacao de Lancamentos por Texto
**Goal**: Permitir cadastro rapido de transacoes em lote a partir de texto estruturado linha a linha.
**Depends on**: Phase 10
**Requirements**: IMP-01, IMP-02, IMP-03, IMP-04, IMP-05
**Success Criteria** (what must be TRUE):
1. User can inserir varias linhas em textarea de importacao e processar tudo de uma vez.
2. Sistema interpreta formato `data tipo descricao valor categoria conta recorrente` e cria payload valido.
3. Sistema mostra feedback por linha invalida sem descartar linhas validas.
4. User can confirmar importacao e visualizar lancamentos importados no fluxo de caixa.
5. Campo de recorrencia aceita variacoes equivalentes de sim/nao sem ambiguidade.
**Plans**: 3 plans

Plans:
- [ ] 11-01: Criar UI de importacao por textarea com exemplos e instrucoes
- [ ] 11-02: Implementar parser/normalizador e validacao por linha
- [ ] 11-03: Integrar persistencia em lote e feedback de resultado

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 10. Home UX Polish for Cashflow | v1.2 | 3/3 | Complete | 2026-03-03 |
| 11. Importacao de Lancamentos por Texto | v1.2 | 0/3 | Not started | - |
