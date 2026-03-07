# Roadmap: Nosso Lar Financeiro

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Lancamentos Unificados e Investimento por Transferencia** — Phases 7-9 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 Ui improvements and Import** — Phases 10-11 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.2-ROADMAP.md`
- ✅ **v1.3 Autenticacao e Isolamento de Conta** — Phases 12-14 (shipped 2026-03-05)
- ✅ **v1.4 Faturas de Cartao no Fluxo de Caixa** — Phases 15-17 (shipped 2026-03-07) — detalhes: `.planning/milestones/v1.4-ROADMAP.md`
- ✅ **v1.5 UX de Faturas em Cartoes** — Phase 18 (shipped 2026-03-07) — detalhes: `.planning/milestones/v1.5-ROADMAP.md`
- ✅ **v1.6 Controle de Pagamentos e Saldo Atual** — Phases 19-21 (shipped 2026-03-07)

## Phases

- [x] **Phase 19: Modelo de Quitacao para Lancamentos em Conta** - Introduzir status pago/nao pago para movimentos de conta e aplicar no calculo de saldo atual. (completed 2026-03-07)
- [x] **Phase 20: Quitacao de Fatura Consolidada de Cartao** - Permitir pagamento de fatura por bloco com conta de pagamento e impacto no saldo atual. (completed 2026-03-08)
- [x] **Phase 21: Card Mes Atual com Saldo Real + Drill-down por Conta** - Exibir saldo atual e saldo previsto separados, com detalhamento por conta e acoes operacionais no fluxo. (completed 2026-03-07)

## Phase Details

### Phase 19: Modelo de Quitacao para Lancamentos em Conta

**Goal**: Criar base de dominio/API/UI para controlar se um compromisso de conta ja foi pago/recebido e refletir isso no saldo atual.  
**Depends on**: Phase 18  
**Requirements**: PAY-01, PAY-02, PAY-03  
**Plans**: 3 plans

Success criteria:
1. Lancamentos em conta aceitam e persistem status `PAGO`/`NAO_PAGO`.
2. Saldo atual da conta considera apenas itens efetivamente quitados/recebidos.
3. Troca de status recalcula imediatamente os saldos sem inconsistencias.

### Phase 20: Quitacao de Fatura Consolidada de Cartao

**Goal**: Tratar pagamento de cartao no nivel da fatura mensal, mantendo compras individuais fora do fluxo operacional principal.  
**Depends on**: Phase 19  
**Requirements**: INVP-01, INVP-02, INVP-03  
**Plans**: 3 plans

Success criteria:
1. Usuario consegue marcar fatura mensal como paga/nao paga.
2. Quitacao de fatura exige conta de pagamento e registra data da quitacao.
3. Impacto no saldo atual ocorre apenas quando fatura esta paga.

### Phase 21: Card Mes Atual com Saldo Real + Drill-down por Conta

**Goal**: Entregar leitura clara da posicao atual (saldo real) sem perder previsao do mes, com detalhamento por conta e acoes operacionais no fluxo.  
**Depends on**: Phase 20  
**Requirements**: BAL-01, BAL-02, BAL-03, BAL-04, CFP-01, CFP-02, CFP-03  
**Plans**: 3 plans

Success criteria:
1. Card `Mes atual` mostra `Saldo` real separado de `Saldo previsto`.
2. Clique no `Saldo` abre composicao por conta e permite identificar origem do total.
3. Extrato sinaliza status pago/nao pago e permite acoes de quitacao com recalculo imediato.
4. Card `Proximo mes` preserva semantica de previsao e nao sofre regressao.

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP Finance Core | 1-4.2 | 17/17 | Complete | 2026-03-03 |
| v1.1 Lancamentos Unificados e Investimento por Transferencia | 7-9 | 8/8 | Complete | 2026-03-03 |
| v1.2 Ui improvements and Import | 10-11 | 6/6 | Complete | 2026-03-03 |
| v1.3 Autenticacao e Isolamento de Conta | 12-14 | 9/9 | Complete | 2026-03-05 |
| v1.4 Faturas de Cartao no Fluxo de Caixa | 15-17 | 9/9 | Complete | 2026-03-07 |
| v1.5 UX de Faturas em Cartoes | 18 | 3/3 | Complete | 2026-03-07 |
| v1.6 Controle de Pagamentos e Saldo Atual | 19-21 | 9/9 | Complete | 2026-03-07 |
