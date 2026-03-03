# Roadmap: Nosso Lar Financeiro (v1.1)

## Overview

Milestone focado em unificar o fluxo de lancamentos financeiros e formalizar investimento como transferencia rastreavel entre contas, sem perder clareza do saldo livre.

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03)
- 🚧 **v1.1 Lancamentos Unificados e Investimento por Transferencia** — Phases 7-9 (in progress)

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

### 🚧 v1.1 Lancamentos Unificados e Investimento por Transferencia

- [x] **Phase 7: Fluxo Unico de Lancamentos** - Unificar criacao e regras de avulso, recorrencia e parcelamento em um mesmo contrato transacional. (completed 2026-03-03)
- [ ] **Phase 8: Modelo de Contas e Transferencia de Investimento** - Introduzir tipos de conta e registrar investimento como saida de origem com entrada de destino.
- [ ] **Phase 9: Consolidados e Semantica Visual de Investimento** - Separar investimento de despesa operacional em saldos, relatorios e linguagem visual.

## Phase Details

### Phase 7: Fluxo Unico de Lancamentos
**Goal**: Garantir que todo novo lancamento (avulso/recorrencia/parcelamento) passe pelo mesmo fluxo e pelo mesmo dominio base.
**Depends on**: Phase 4.2
**Requirements**: LAN-01, LAN-02, LAN-03, LAN-04
**Success Criteria** (what must be TRUE):
  1. User can criar novo lancamento em fluxo unico escolhendo avulso, recorrencia ou parcelamento.
  2. Regras de vencimento/periodicidade/parcelamento sao aplicadas por contrato unico e consistente.
  3. User can alterar somente futuras ocorrencias sem mutar historico financeiro fechado.
  4. Extrato e projecao mostram claramente origem recorrencia vs parcelamento.
**Plans**: 3 plans

### Phase 8: Modelo de Contas e Transferencia de Investimento
**Goal**: Implementar investimento como transferencia contabil rastreavel entre origem e destino com tipagem de conta.
**Depends on**: Phase 7
**Requirements**: ACC-01, ACC-02, INV-01, INV-02
**Success Criteria** (what must be TRUE):
  1. User can manter contas tipadas como Conta Corrente ou Conta Investimento.
  2. Investimento sempre exige origem de saida valida e destino de entrada valido.
  3. Sistema persiste investimento como evento atomico com debito na origem e credito no destino.
  4. Movimentacoes guardam rastreabilidade completa para auditoria e reconciliacao.
**Plans**: 3 plans

### Phase 9: Consolidados e Semantica Visual de Investimento
**Goal**: Exibir investimento como saida separada de gasto operacional, com consolidacao correta em saldos e relatorios.
**Depends on**: Phase 8
**Requirements**: INV-03, INV-04, ACC-03
**Success Criteria** (what must be TRUE):
  1. Resumo financeiro soma investimentos separadamente de despesas operacionais.
  2. Lancamentos de investimento nao usam destaque visual vermelho de gasto comum.
  3. Saldos e relatorios distinguem aporte para investimento de consumo real, sem dupla contagem.
**Plans**: 2 plans

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. Fluxo Unico de Lancamentos | v1.1 | 3/3 | Complete | 2026-03-03 |
| 8. Modelo de Contas e Transferencia de Investimento | v1.1 | 0/3 | Not started | - |
| 9. Consolidados e Semantica Visual de Investimento | v1.1 | 0/2 | Not started | - |
