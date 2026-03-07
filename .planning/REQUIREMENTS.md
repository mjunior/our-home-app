# Requirements: Nosso Lar Financeiro

**Defined:** 2026-03-07
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## v1 Requirements

### Payment Status Control

- [ ] **PAY-01**: Usuario pode marcar lancamento em conta como `PAGO` ou `NAO_PAGO`.
- [ ] **PAY-02**: Despesa `NAO_PAGA` nao reduz saldo atual da conta ate ser quitada.
- [ ] **PAY-03**: Receita `NAO_PAGA` nao aumenta saldo atual da conta ate ser recebida.

### Credit Card Invoice Payment

- [ ] **INVP-01**: Usuario pode marcar fatura mensal de cartao como paga/nao paga como bloco unico.
- [ ] **INVP-02**: Ao pagar fatura, sistema registra data de quitacao e conta de pagamento.
- [ ] **INVP-03**: Valor da fatura paga impacta saldo atual apenas no momento da quitacao.

### Current Month Balance Card

- [ ] **BAL-01**: Card `Mes atual` exibe `Saldo` real do momento com base em movimentos pagos/recebidos.
- [ ] **BAL-02**: Card `Mes atual` mantem `Saldo previsto` separado, sem regressao no calculo atual de previsao.
- [ ] **BAL-03**: Clique em `Saldo` abre detalhamento com saldo individual de cada conta incluida no total.
- [ ] **BAL-04**: Card `Proximo mes` permanece exibindo apenas previsao.

### Cashflow Visibility and Actions

- [ ] **CFP-01**: Extrato principal mostra claramente o status de quitacao (`PAGO`/`NAO_PAGO`) dos itens aplicaveis.
- [ ] **CFP-02**: Usuario consegue quitar/desfazer quitacao de item elegivel direto no fluxo operacional.
- [ ] **CFP-03**: Quitacao/desquitacao recalcula imediatamente saldo atual e composicao por conta.

## v2 Requirements

### Credit Card Enhancements

- **CCX-01**: Registrar pagamento parcial de fatura com saldo remanescente.
- **CCX-02**: Simular juros de rotativo e parcelamento da fatura.
- **CCX-03**: Notificar vencimento de fatura por push/email.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Quitacao parcial de uma unica fatura no v1.6 | Aumenta muito a complexidade de conciliacao e rateio |
| Conciliacao bancaria automatica | Exige integracao externa/Open Finance |
| Motor de cobranca de juros | Escopo financeiro avancado para milestone posterior |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| PAY-01 | Phase 19 | Complete |
| PAY-02 | Phase 19 | Complete |
| PAY-03 | Phase 19 | Complete |
| INVP-01 | Phase 20 | Pending |
| INVP-02 | Phase 20 | Pending |
| INVP-03 | Phase 20 | Pending |
| BAL-01 | Phase 21 | Pending |
| BAL-02 | Phase 21 | Pending |
| BAL-03 | Phase 21 | Pending |
| BAL-04 | Phase 21 | Pending |
| CFP-01 | Phase 21 | Pending |
| CFP-02 | Phase 21 | Pending |
| CFP-03 | Phase 21 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-07*
*Last updated: 2026-03-07 after v1.6 requirements definition*
