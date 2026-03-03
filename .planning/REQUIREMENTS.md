# Requirements: Nosso Lar Financeiro

**Defined:** 2026-03-02
**Core Value:** Mostrar com clareza o saldo livre do mês atual e do próximo mês para evitar ficar no negativo

## v1 Requirements

### Accounts

- [ ] **ACCT-01**: User can cadastrar contas (corrente/poupança/dinheiro) com nome e tipo
- [ ] **ACCT-02**: User can definir saldo inicial de cada conta
- [ ] **ACCT-03**: User can visualizar saldo consolidado entre contas

### Credit Cards

- [ ] **CARD-01**: User can cadastrar cartão com dia de fechamento e dia de vencimento
- [ ] **CARD-02**: User can registrar compra no cartão com data da compra e valor
- [ ] **CARD-03**: User can visualizar fatura atual e próxima fatura por cartão

### Cash Flow

- [ ] **CASH-01**: User can registrar entrada de receita em uma conta
- [ ] **CASH-02**: User can registrar saída de despesa em uma conta e/ou cartão
- [ ] **CASH-03**: User can visualizar extrato mensal de entradas e saídas

### Installments & Recurrence

- [ ] **RECU-01**: User can marcar uma compra como parcelada e gerar parcelas futuras
- [ ] **RECU-02**: User can marcar uma receita/despesa como recorrente mensal
- [ ] **RECU-03**: User can editar ou encerrar recorrência sem corromper histórico passado

### Categories & Reports

- [ ] **CAT-01**: User can criar e editar categorias de transação
- [ ] **CAT-02**: User can atribuir categoria a cada lançamento
- [ ] **CAT-03**: User can visualizar total mensal por categoria

### Free Balance

- [ ] **FREE-01**: User can ver saldo livre do mês atual considerando despesas futuras já planejadas
- [ ] **FREE-02**: User can ver projeção do saldo livre do próximo mês considerando recorrências e parcelas
- [ ] **FREE-03**: User can entender composição do saldo livre (contas, faturas, recorrências, parcelas)

### Investments

- [ ] **INV-01**: User can cadastrar investimento com tipo, valor aplicado e data
- [ ] **INV-02**: User can registrar aporte, rendimento e resgate
- [ ] **INV-03**: User can visualizar posição consolidada de investimentos

### Wishlist

- [ ] **WISH-01**: User can criar itens de desejo com valor alvo e prioridade
- [ ] **WISH-02**: User can simular impacto de um item no saldo livre do mês

## v2 Requirements

### Collaboration & Automation

- **COLL-01**: Multiusuário com perfis (casal/família)
- **AUTO-01**: Importação automática de transações via Open Finance
- **AUTO-02**: Regras de categorização automática por descrição
- **ALRT-01**: Alertas automáticos de risco de saldo negativo

## Out of Scope

| Feature | Reason |
|---------|--------|
| App mobile nativo | Web-first para validar fluxo do produto |
| Planejamento tributário avançado | Fora do foco doméstico inicial |
| Trading de ativos | Não contribui para objetivo principal de saldo livre |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACCT-01 | Phase 1 | Complete |
| ACCT-02 | Phase 1 | Complete |
| ACCT-03 | Phase 1 | Complete |
| CARD-01 | Phase 1 | Complete |
| CARD-02 | Phase 2 | Complete |
| CARD-03 | Phase 2 | Complete |
| CASH-01 | Phase 2 | Complete |
| CASH-02 | Phase 2 | Complete |
| CASH-03 | Phase 2 | Complete |
| RECU-01 | Phase 3 | Complete |
| RECU-02 | Phase 3 | Complete |
| RECU-03 | Phase 3 | Complete |
| CAT-01 | Phase 1 | Complete |
| CAT-02 | Phase 2 | Complete |
| CAT-03 | Phase 5 | Pending |
| FREE-01 | Phase 4 | Complete |
| FREE-02 | Phase 4 | Complete |
| FREE-03 | Phase 4 | Complete |
| INV-01 | Phase 5 | Pending |
| INV-02 | Phase 5 | Pending |
| INV-03 | Phase 5 | Pending |
| WISH-01 | Phase 6 | Pending |
| WISH-02 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-02*
*Last updated: 2026-03-02 after initial definition*
