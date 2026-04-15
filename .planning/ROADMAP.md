# Roadmap: Nosso Lar Financeiro

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Lancamentos Unificados e Investimento por Transferencia** — Phases 7-9 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 Ui improvements and Import** — Phases 10-11 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.2-ROADMAP.md`
- ✅ **v1.3 Autenticacao e Isolamento de Conta** — Phases 12-14 (shipped 2026-03-05)
- ✅ **v1.4 Faturas de Cartao no Fluxo de Caixa** — Phases 15-17 (shipped 2026-03-07) — detalhes: `.planning/milestones/v1.4-ROADMAP.md`
- ✅ **v1.5 UX de Faturas em Cartoes** — Phase 18 (shipped 2026-03-07) — detalhes: `.planning/milestones/v1.5-ROADMAP.md`
- ✅ **v1.6 Controle de Pagamentos e Saldo Atual** — Phases 19-21.1 (shipped 2026-03-07)
- ◆ **v1.7 Objetivos de Investimento e Feedback Operacional** — Phases 22-23 (implemented 2026-03-09; verification pending)
- ◆ **v1.8 Reajuste de Conta e Cartao** — Phases 24-26 (planned 2026-04-15)

## Phases

- [x] **Phase 19: Modelo de Quitacao para Lancamentos em Conta** - Introduzir status pago/nao pago para movimentos de conta e aplicar no calculo de saldo atual. (completed 2026-03-07)
- [x] **Phase 20: Quitacao de Fatura Consolidada de Cartao** - Permitir pagamento de fatura por bloco com conta de pagamento e impacto no saldo atual. (completed 2026-03-08)
- [x] **Phase 21: Card Mes Atual com Saldo Real + Drill-down por Conta** - Exibir saldo atual e saldo previsto separados, com detalhamento por conta e acoes operacionais no fluxo. (completed 2026-03-07)
- [x] **Phase 21.1: Gap Closure do Clique no Saldo para Drill-down** - Tornar o proprio saldo do card `Mes atual` o gatilho principal do detalhamento por conta. (completed 2026-03-07)
- [ ] **Phase 22: Objetivos por Conta de Investimento** - Adicionar meta opcional para contas `INVESTMENT` com persistencia, calculo de progresso e leitura de quanto falta. (implemented 2026-03-09; verification pending)
- [ ] **Phase 23: Feedback Operacional no Cashflow** - Melhorar navegacao mensal e feedback visual de acoes de cadastro para reduzir ambiguidade de interacao. (implemented 2026-03-09; verification pending)
- [ ] **Phase 24: Reajuste de Saldo em Conta** - Permitir que o usuario informe o saldo real de uma conta e gerar automaticamente um lancamento `REAJUSTE` positivo ou negativo para igualar o app. (planned)
- [ ] **Phase 25: Reajuste de Fatura de Cartao** - Permitir que o usuario informe o valor real de uma fatura de cartao e gerar automaticamente uma transacao `REAJUSTE` na fatura correta. (planned)
- [ ] **Phase 26: Preview, Auditoria e Salvaguardas de Reajuste** - Consolidar preview, caso sem diferenca, identificacao de reajustes e protecoes de propriedade antes da gravacao. (planned)

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

### Phase 21.1: Gap Closure do Clique no Saldo para Drill-down

**Goal**: Fechar o gap de UX do milestone v1.6 garantindo que clicar no proprio `Saldo` abra a composicao por conta.  
**Depends on**: Phase 21  
**Requirements**: BAL-03  
**Plans**: 1 plan

Success criteria:
1. Clique no valor/bloco de `Saldo` no card `Mes atual` abre o detalhamento por conta.
2. Interacao preserva acessibilidade por teclado (Enter/Espaco) e nao remove o atalho auxiliar existente.
3. Testes e2e cobrem explicitamente o clique no saldo como entrada do fluxo.

### Phase 22: Objetivos por Conta de Investimento

**Goal**: Permitir que cada conta de investimento carregue uma meta financeira clara e mostrar progresso/falta sem alterar a logica contabil existente.  
**Depends on**: Phase 21.1  
**Requirements**: INVG-01, INVG-02, INVG-03, INVG-04, INVG-05  
**Plans**: 3 plans

Success criteria:
1. Usuario pode definir e editar `amount goal` apenas em contas do tipo `INVESTMENT`.
2. Persistencia e dominio armazenam meta sem impactar saldo calculado da conta.
3. Tela de contas mostra saldo atual, meta, progresso percentual e valor faltante de forma legivel.
4. Meta atingida aparece como concluida, sem exibir valor faltante negativo.

### Phase 23: Feedback Operacional no Cashflow

**Goal**: Tornar a interacao do cashflow mais evidente visualmente quando o usuario troca de mes ou envia um novo lancamento.  
**Depends on**: Phase 22  
**Requirements**: NAV-01, NAV-02, NAV-03, TXF-01, TXF-02, TXF-03  
**Plans**: 3 plans

Success criteria:
1. Usuario consegue navegar meses com controles explicitos de avancar/voltar alem do rail existente.
2. Mes selecionado e acoes de navegacao demonstram estados visuais claros de ativo, hover, foco e clique.
3. Formulario de novo lancamento mostra processamento em andamento e evita submissao duplicada.
4. Feedback visual de botoes/CTAs fica consistente com a linguagem do app em mobile e desktop.

### Phase 24: Reajuste de Saldo em Conta

**Goal**: Criar o fluxo de dominio/API/UI para reajustar uma conta a partir do saldo real informado pelo usuario.  
**Depends on**: Phase 23  
**Requirements**: ACADJ-01, ACADJ-02, ACADJ-03, ACADJ-04, ACADJ-05, ADJ-04  
**Plans**: 3 plans

Success criteria:
1. Usuario seleciona conta, data, mes de competencia e valor real para simular o reajuste.
2. Sistema calcula a diferenca entre saldo do app e valor real informado, incluindo sinal correto.
3. Sistema grava lancamento `REAJUSTE` positivo ou negativo na data escolhida para igualar a conta ao valor real.
4. Calculo respeita isolamento por `userId` e atualiza saldo atual/previsto sem afetar outras contas.

### Phase 25: Reajuste de Fatura de Cartao

**Goal**: Estender o reajuste para faturas de cartao, comparando o total da fatura no app com o valor real informado pelo usuario.  
**Depends on**: Phase 24  
**Requirements**: CCADJ-01, CCADJ-02, CCADJ-03, CCADJ-04, CCADJ-05  
**Plans**: 3 plans

Success criteria:
1. Usuario seleciona cartao, mes da fatura, data do lancamento e valor real da fatura.
2. Sistema calcula a diferenca entre total da fatura no app e valor real informado.
3. Sistema grava transacao de cartao `REAJUSTE` positiva ou negativa vinculada a fatura correta.
4. Reajuste aparece no modulo de cartoes e no cashflow consolidado da fatura sem alterar outros ciclos.

### Phase 26: Preview, Auditoria e Salvaguardas de Reajuste

**Goal**: Fechar a experiencia compartilhada de reajuste com preview claro, caso sem diferenca e identificacao auditavel no historico.  
**Depends on**: Phase 25  
**Requirements**: ADJ-01, ADJ-02, ADJ-03  
**Plans**: 3 plans

Success criteria:
1. Antes de salvar, usuario ve valor no app, valor real informado, diferenca calculada e sinal do reajuste.
2. Quando a diferenca e zero, sistema comunica que nao ha lancamento necessario e nao cria transacao vazia.
3. Reajustes ficam visivelmente identificados como `REAJUSTE` em extratos/faturas e continuam editaveis/excluiveis conforme regras existentes.
4. Testes cobrem reajuste positivo, reajuste negativo e caso sem diferenca para conta e cartao.

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP Finance Core | 1-4.2 | 17/17 | Complete | 2026-03-03 |
| v1.1 Lancamentos Unificados e Investimento por Transferencia | 7-9 | 8/8 | Complete | 2026-03-03 |
| v1.2 Ui improvements and Import | 10-11 | 6/6 | Complete | 2026-03-03 |
| v1.3 Autenticacao e Isolamento de Conta | 12-14 | 9/9 | Complete | 2026-03-05 |
| v1.4 Faturas de Cartao no Fluxo de Caixa | 15-17 | 9/9 | Complete | 2026-03-07 |
| v1.5 UX de Faturas em Cartoes | 18 | 3/3 | Complete | 2026-03-07 |
| v1.6 Controle de Pagamentos e Saldo Atual | 19-21.1 | 10/10 | Complete | 2026-03-07 |
| v1.7 Objetivos de Investimento e Feedback Operacional | 22-23 | 6/6 | Implementation Complete | — |
| v1.8 Reajuste de Conta e Cartao | 24-26 | 0/9 | Planned | — |
