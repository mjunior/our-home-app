# Requirements: Nosso Lar Financeiro

**Defined:** 2026-03-06
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## v1 Requirements

### Credit Card Billing Rules

- [x] **CCB-01**: Compra no cartao com dia do mes menor que `closeDay` entra na fatura do mesmo mes de competencia.
- [x] **CCB-02**: Compra no cartao com dia do mes igual ou maior que `closeDay` entra na fatura do mes seguinte.
- [x] **CCB-03**: Regra de fechamento e aplicada com `closeDay` configuravel por cartao.
- [x] **CCB-04**: Dia de pagamento (`dueDay`) e configuravel por cartao e usado para data de vencimento da fatura no fluxo de caixa.

### Cashflow Invoice Projection

- [x] **CFI-01**: Extrato principal do cashflow nao exibe despesas individuais de cartao de credito.
- [x] **CFI-02**: Extrato principal exibe lancamento consolidado `Fatura [Cartao]` por cartao e competencia.
- [x] **CFI-03**: Lancamento de fatura no cashflow ocorre no dia de pagamento (`dueDay`) do cartao para o mes correspondente.
- [x] **CFI-04**: Total da fatura consolidada considera todas as despesas de cartao daquela competencia, respeitando edicoes/exclusoes.

### Card Invoices View

- [ ] **CIV-01**: Tela de cartao exibe lista simples de faturas por mes com total consolidado.
- [ ] **CIV-02**: Usuario consegue abrir uma fatura e visualizar despesas individuais vinculadas.
- [ ] **CIV-03**: A partir da fatura aberta, usuario consegue editar despesa individual com mesmo fluxo atual de edicao.
- [ ] **CIV-04**: Alteracao em despesa individual atualiza imediatamente o total da fatura e a projecao consolidada do cashflow.

## v2 Requirements

### Credit Card Enhancements

- **CCX-01**: Registrar pagamento parcial de fatura com saldo remanescente.
- **CCX-02**: Simular juros de rotativo e parcelamento da fatura.
- **CCX-03**: Notificar vencimento de fatura por push/email.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Importacao automatica de extrato da operadora do cartao | Exige integracoes externas e credenciais, fora do foco de logica interna |
| Split de uma mesma compra entre faturas | Regra complexa sem demanda atual validada |
| Multi-moeda em cartao | Dominio atual opera em BRL |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CCB-01 | Phase 15 | Complete |
| CCB-02 | Phase 15 | Complete |
| CCB-03 | Phase 15 | Complete |
| CCB-04 | Phase 15 | Complete |
| CFI-01 | Phase 16 | Complete |
| CFI-02 | Phase 16 | Complete |
| CFI-03 | Phase 16 | Complete |
| CFI-04 | Phase 16 | Complete |
| CIV-01 | Phase 17 | Pending |
| CIV-02 | Phase 17 | Pending |
| CIV-03 | Phase 17 | Pending |
| CIV-04 | Phase 17 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-07 after phase 16 verification*
