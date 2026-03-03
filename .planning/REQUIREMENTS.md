# Requirements: Nosso Lar Financeiro (v1.1)

**Defined:** 2026-03-03
**Milestone:** v1.1 Lancamentos Unificados e Investimento por Transferencia
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo

## v1.1 Requirements

### Unified Launch Flow

- [ ] **LAN-01**: User can criar novo lancamento em fluxo unico escolhendo tipo avulso, recorrencia ou parcelamento.
- [ ] **LAN-02**: Sistema aplica regras consistentes de vencimento, periodicidade e parcelamento a partir de contrato base unico.
- [ ] **LAN-03**: User can editar apenas ocorrencias futuras sem alterar historico financeiro fechado.
- [ ] **LAN-04**: User can identificar no extrato e na projecao se o compromisso veio de recorrencia ou parcelamento.

### Investment Transfers

- [ ] **INV-01**: User can registrar investimento informando origem (saida) e destino (entrada) no mesmo fluxo transacional.
- [ ] **INV-02**: Sistema persiste investimento como evento atomico com dupla movimentacao: debito na origem e credito no destino.
- [ ] **INV-03**: Sistema soma investimentos separadamente no resumo financeiro, sem misturar com despesa operacional comum.
- [ ] **INV-04**: Valores de investimento nao aparecem com destaque vermelho de gasto no UI.

### Account Types and Balances

- [ ] **ACC-01**: User can cadastrar e manter contas com tipo Conta Corrente ou Conta Investimento.
- [ ] **ACC-02**: Sistema valida regra de investimento: origem precisa ser conta de saida valida e destino precisa ser conta/caixinha de investimento.
- [ ] **ACC-03**: User can visualizar saldos por tipo de conta e consolidado geral sem dupla contagem de transferencia interna.

## Future Requirements

- **API-01**: Padronizar mensagens de erro amigaveis em todos os endpoints core (deferido)
- **API-02**: Validacao de payload com contrato padrao em toda API (deferido)
- **API-03**: Modularizacao completa routes/controllers/services (deferido)
- **WISH-01**: Wishlist com prioridade e valor alvo (deferido)
- **WISH-02**: Simulador de impacto da wishlist no saldo livre (deferido)
- **AUTO-01**: Importacao Open Finance (deferido)

## Out of Scope (v1.1)

| Feature | Reason |
|---------|--------|
| App mobile nativo | Web mobile-first segue suficiente no ciclo atual |
| Multiusuario com perfis | Nao necessario para validar motor financeiro reestruturado |
| Trading avancado | Fora do foco de financas domesticas |
| Integracao com corretoras | Depende de escopo de mercado financeiro, nao do controle domestico |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAN-01 | Phase 7 | Planned |
| LAN-02 | Phase 7 | Planned |
| LAN-03 | Phase 7 | Planned |
| LAN-04 | Phase 7 | Planned |
| INV-01 | Phase 8 | Planned |
| INV-02 | Phase 8 | Planned |
| INV-03 | Phase 9 | Planned |
| INV-04 | Phase 9 | Planned |
| ACC-01 | Phase 8 | Planned |
| ACC-02 | Phase 8 | Planned |
| ACC-03 | Phase 9 | Planned |

**Coverage:**
- v1.1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after v1.1 scope refinement*
