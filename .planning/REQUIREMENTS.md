# Requirements: Nosso Lar Financeiro

**Defined:** 2026-04-15
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## v1 Requirements

### Account Adjustment

- [ ] **ACADJ-01**: Usuario pode iniciar um reajuste para uma conta informando conta, valor real, data do lancamento e mes de competencia.
- [x] **ACADJ-02**: Sistema calcula a diferenca entre o saldo da conta no app e o valor real informado pelo usuario.
- [x] **ACADJ-03**: Sistema cria um lancamento unico `REAJUSTE` positivo quando o valor real for maior que o saldo do app.
- [x] **ACADJ-04**: Sistema cria um lancamento unico `REAJUSTE` negativo quando o valor real for menor que o saldo do app.
- [x] **ACADJ-05**: Reajuste de conta impacta saldo atual e saldo previsto de forma consistente com a data escolhida e o status operacional do lancamento.

### Credit Card Adjustment

- [ ] **CCADJ-01**: Usuario pode iniciar um reajuste para cartao informando cartao, mes da fatura, data do lancamento e valor real da fatura.
- [ ] **CCADJ-02**: Sistema calcula a diferenca entre o total atual da fatura no app e o valor real informado pelo usuario.
- [ ] **CCADJ-03**: Sistema cria uma transacao de cartao `REAJUSTE` positiva quando o valor real da fatura for maior que o total no app.
- [ ] **CCADJ-04**: Sistema cria uma transacao de cartao `REAJUSTE` negativa quando o valor real da fatura for menor que o total no app.
- [ ] **CCADJ-05**: Reajuste de cartao e lancado na fatura do mes informado e aparece no modulo de cartoes e no cashflow consolidado dessa fatura.

### Adjustment Safety and Audit

- [ ] **ADJ-01**: Usuario ve preview antes de salvar com valor no app, valor real informado, diferenca calculada e sinal do lancamento.
- [ ] **ADJ-02**: Sistema trata diferenca zero como caso sem lancamento necessario e nao cria transacao vazia.
- [ ] **ADJ-03**: Reajustes ficam identificados como `REAJUSTE` no historico para auditoria, edicao/exclusao e entendimento futuro.
- [x] **ADJ-04**: Sistema valida que conta/cartao, fatura e lancamento pertencem ao usuario autenticado antes de calcular ou gravar o reajuste.

## v2 Requirements

### Reconciliation Extensions

- **REC-01**: Usuario pode importar extrato e reconciliar divergencias linha a linha.
- **REC-02**: Sistema sugere categorias ou transacoes candidatas que explicam a diferenca.
- **REC-03**: Usuario pode executar reajuste em lote para multiplas contas/cartoes.
- **REC-04**: Sistema mostra historico agrupado de reajustes por periodo e origem.

### Bank Integration

- **BNK-01**: Sistema pode integrar com APIs bancarias/Open Finance para obter saldo real automaticamente.
- **BNK-02**: Sistema pode avisar quando saldo/fatura real divergir do app acima de um limite configurado.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sincronizacao automatica com banco/Open Finance | O objetivo deste milestone e sincronizacao manual informando o valor real |
| Importacao de extrato para reconciliacao linha a linha | E um fluxo maior que exige parser, matching e revisao manual |
| Distribuir a diferenca entre categorias ou compras originais | O reajuste representa correcao explicita, nao investigacao da origem da divergencia |
| Reajuste em lote para varias contas/cartoes | A primeira entrega deve validar o fluxo individual com menor risco |
| Alterar limite do cartao | O pedido e sincronizar valor real da fatura, nao limite/credito disponivel |
| Reabrir ou recalcular faturas fora do mes escolhido | O usuario deve controlar exatamente o mes/fatura que esta ajustando |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ACADJ-01 | Phase 24 | Pending |
| ACADJ-02 | Phase 24 | Complete |
| ACADJ-03 | Phase 24 | Complete |
| ACADJ-04 | Phase 24 | Complete |
| ACADJ-05 | Phase 24 | Complete |
| CCADJ-01 | Phase 25 | Pending |
| CCADJ-02 | Phase 25 | Pending |
| CCADJ-03 | Phase 25 | Pending |
| CCADJ-04 | Phase 25 | Pending |
| CCADJ-05 | Phase 25 | Pending |
| ADJ-01 | Phase 26 | Pending |
| ADJ-02 | Phase 26 | Pending |
| ADJ-03 | Phase 26 | Pending |
| ADJ-04 | Phase 24 | Complete |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-15*
*Last updated: 2026-04-15 after v1.8 roadmap creation*
