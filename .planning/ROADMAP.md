# Roadmap: Nosso Lar Financeiro

## Overview

A jornada começa com a fundação dos dados financeiros da casa (contas, cartões e categorias), evolui para fluxo de caixa com faturas, adiciona automações de parcelamento/recorrência e culmina no painel de saldo livre como decisão central de gasto mensal. Em seguida, amplia para investimentos e wishlist conectada ao impacto real de caixa.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Fundação Financeira** - Estruturar contas, cartões base e categorias.
- [x] **Phase 2: Fluxo de Caixa e Faturas** - Registrar entradas/saídas e consolidar extrato mensal.
- [ ] **Phase 3: Parcelas e Recorrências** - Automatizar compromissos futuros.
- [ ] **Phase 4: Motor de Saldo Livre** - Calcular saldo livre atual e projetado com explicabilidade.
- [ ] **Phase 5: Investimentos e Relatórios** - Gerenciar carteira básica e visão por categoria.
- [ ] **Phase 6: Wishlist com Impacto** - Priorizar desejos com simulação no saldo livre.

## Phase Details

### Phase 1: Fundação Financeira
**Goal**: Criar base de dados e interface para contas, cartões (cadastro inicial) e categorias.
**Depends on**: Nothing (first phase)
**Requirements**: ACCT-01, ACCT-02, ACCT-03, CARD-01, CAT-01
**Success Criteria** (what must be TRUE):
  1. User can cadastrar contas e informar saldo inicial.
  2. User can cadastrar cartão com fechamento e vencimento.
  3. User can criar e editar categorias de transação.
  4. Dashboard mostra saldo consolidado entre contas.
**Plans**: 3 plans

Plans:
- [x] 01-01: Modelagem de dados (contas, cartões, categorias)
- [x] 01-02: CRUD de contas e cartões
- [x] 01-03: CRUD de categorias e consolidação inicial de saldo

### Phase 2: Fluxo de Caixa e Faturas
**Goal**: Permitir lançamentos financeiros completos e visualização da fatura/extrato mensal.
**Depends on**: Phase 1
**Requirements**: CARD-02, CARD-03, CASH-01, CASH-02, CASH-03, CAT-02
**Success Criteria** (what must be TRUE):
  1. User can registrar entradas e saídas vinculando conta e/ou cartão.
  2. User can visualizar extrato mensal consolidado.
  3. User can acompanhar fatura atual e próxima por cartão.
  4. Todos os lançamentos aceitam categorização.
**Plans**: 3 plans

Plans:
- [x] 02-01: Fluxo de lançamentos de receita e despesa
- [x] 02-02: Regras de fatura por ciclo de cartão
- [x] 02-03: Extrato mensal e filtros por categoria/conta/cartão

### Phase 3: Parcelas e Recorrências
**Goal**: Materializar obrigações futuras de forma previsível e auditável.
**Depends on**: Phase 2
**Requirements**: RECU-01, RECU-02, RECU-03
**Success Criteria** (what must be TRUE):
  1. User can parcelar compras e ver cronograma de parcelas futuras.
  2. User can criar receitas/despesas recorrentes mensais.
  3. User can editar/encerrar recorrência sem alterar histórico já fechado.
**Plans**: 2 plans

Plans:
- [ ] 03-01: Motor de geração de parcelas e recorrências
- [ ] 03-02: Tela de gestão e edição segura de recorrências

### Phase 4: Motor de Saldo Livre
**Goal**: Entregar métrica principal de decisão financeira com projeção mensal.
**Depends on**: Phase 3
**Requirements**: FREE-01, FREE-02, FREE-03
**Success Criteria** (what must be TRUE):
  1. User can ver saldo livre do mês atual considerando obrigações futuras.
  2. User can ver saldo livre projetado do próximo mês sem inconsistências.
  3. User can entender composição do saldo livre por fonte de valor.
**Plans**: 3 plans

Plans:
- [ ] 04-01: Definições formais de saldo atual/projetado/livre
- [ ] 04-02: Cálculo do saldo livre atual e próximo mês
- [ ] 04-03: Dashboard explicável de composição do saldo livre

### Phase 5: Investimentos e Relatórios
**Goal**: Incluir investimentos no panorama financeiro e relatório mensal por categoria.
**Depends on**: Phase 4
**Requirements**: INV-01, INV-02, INV-03, CAT-03
**Success Criteria** (what must be TRUE):
  1. User can cadastrar investimentos e eventos (aporte, rendimento, resgate).
  2. User can visualizar posição consolidada de investimentos.
  3. User can ver totais mensais por categoria com dados confiáveis.
**Plans**: 2 plans

Plans:
- [ ] 05-01: Módulo de investimentos e eventos
- [ ] 05-02: Relatórios mensais por categoria

### Phase 6: Wishlist com Impacto
**Goal**: Ajudar decisão de compra com base no impacto real no saldo livre.
**Depends on**: Phase 5
**Requirements**: WISH-01, WISH-02
**Success Criteria** (what must be TRUE):
  1. User can cadastrar itens de desejo com prioridade e valor.
  2. User can simular impacto de compra no saldo livre do mês.
  3. User pode comparar itens por impacto e prioridade para decidir o que comprar.
**Plans**: 2 plans

Plans:
- [ ] 06-01: CRUD de wishlist e priorização
- [ ] 06-02: Simulador de impacto da wishlist no saldo livre

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Fundação Financeira | 3/3 | Complete | 2026-03-02 |
| 2. Fluxo de Caixa e Faturas | 3/3 | Complete | 2026-03-02 |
| 3. Parcelas e Recorrências | 0/2 | Not started | - |
| 4. Motor de Saldo Livre | 0/3 | Not started | - |
| 5. Investimentos e Relatórios | 0/2 | Not started | - |
| 6. Wishlist com Impacto | 0/2 | Not started | - |
