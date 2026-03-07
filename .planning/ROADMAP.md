# Roadmap: Nosso Lar Financeiro

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Lancamentos Unificados e Investimento por Transferencia** — Phases 7-9 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 Ui improvements and Import** — Phases 10-11 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.2-ROADMAP.md`
- ✅ **v1.3 Autenticacao e Isolamento de Conta** — Phases 12-14 (shipped 2026-03-05)
- ◆ **v1.4 Faturas de Cartao no Fluxo de Caixa** — Phases 15-17 (in progress)

## Phases

- [ ] **Phase 15: Motor de Competencia de Fatura por Fechamento** - Aplicar regra de fechamento (`closeDay`) e vencimento (`dueDay`) por cartao para classificar compras na fatura correta.
- [ ] **Phase 16: Fluxo de Caixa Consolidado por Fatura** - Substituir exibicao de compras individuais de cartao por lancamentos consolidados de fatura no extrato principal.
- [ ] **Phase 17: Tela de Cartao com Lista de Faturas e Drill-down** - Exibir faturas por mes no modulo de cartoes e abrir detalhe para editar despesas individuais.

## Phase Details

### Phase 15: Motor de Competencia de Fatura por Fechamento

**Goal**: Garantir classificacao correta de compras de cartao em faturas por mes de competencia com regra de fechamento inclusiva e vencimento configuravel.  
**Depends on**: Phase 14  
**Requirements**: CCB-01, CCB-02, CCB-03, CCB-04  
**Plans**: 3 plans

Success criteria:
1. Compra realizada antes do `closeDay` entra na fatura da competencia corrente.
2. Compra realizada no `closeDay` entra na fatura da competencia seguinte.
3. Compra realizada depois do `closeDay` entra na fatura da competencia seguinte.
4. Cada cartao respeita seu proprio `closeDay` e `dueDay` configurados.

### Phase 16: Fluxo de Caixa Consolidado por Fatura

**Goal**: Tornar o extrato do cashflow operacional, exibindo obrigacao de pagamento por cartao (fatura) em vez de cada compra individual.  
**Depends on**: Phase 15  
**Requirements**: CFI-01, CFI-02, CFI-03, CFI-04  
**Plans**: 3 plans

Success criteria:
1. Extrato principal nao mostra compras individuais de cartao.
2. Extrato principal mostra `Fatura [Cartao]` consolidada por competencia.
3. Data de exibicao da fatura no extrato usa `dueDay` do cartao.
4. Total da fatura reflete inclusoes, edicoes e exclusoes de compras vinculadas.

### Phase 17: Tela de Cartao com Lista de Faturas e Drill-down

**Goal**: Entregar visao dedicada de cartao com lista de faturas e acesso ao detalhe de despesas para manutencao individual.  
**Depends on**: Phase 16  
**Requirements**: CIV-01, CIV-02, CIV-03, CIV-04  
**Plans**: 3 plans

Success criteria:
1. Modulo de cartoes lista faturas mensais com total consolidado.
2. Clique na fatura abre detalhe com despesas individuais.
3. Edicao de despesa individual e possivel sem sair do contexto de fatura.
4. Recalculo de total de fatura e reflexo no cashflow acontecem imediatamente apos alteracao.

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP Finance Core | 1-4.2 | 17/17 | Complete | 2026-03-03 |
| v1.1 Lancamentos Unificados e Investimento por Transferencia | 7-9 | 8/8 | Complete | 2026-03-03 |
| v1.2 Ui improvements and Import | 10-11 | 6/6 | Complete | 2026-03-03 |
| v1.3 Autenticacao e Isolamento de Conta | 12-14 | 9/9 | Complete | 2026-03-05 |
| v1.4 Faturas de Cartao no Fluxo de Caixa | 15-17 | 0/9 | In Progress | — |
