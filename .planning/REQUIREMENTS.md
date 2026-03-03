# Requirements: Nosso Lar Financeiro (v1.1)

**Defined:** 2026-03-03
**Milestone:** v1.1 Reestruturacao de Compromissos e Investimentos
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo

## v1.1 Requirements

### Recurrence & Installments Rebuild

- [ ] **SCH-01**: User can cadastrar recorrencias e parcelamentos em um modelo unificado com regras consistentes.
- [ ] **SCH-02**: User can editar recorrencias/parcelamentos futuros sem alterar historico fechado.
- [ ] **SCH-03**: User can visualizar previsao mensal de obrigacoes futuras gerada pelo novo motor.
- [ ] **SCH-04**: User can identificar claramente origem da obrigacao (recorrencia ou parcela) no extrato/projecao.

### Investments

- [ ] **INV-01**: User can cadastrar ativos/investimentos com classificacao e saldo inicial.
- [ ] **INV-02**: User can registrar eventos de investimento (aporte, rendimento, resgate).
- [ ] **INV-03**: User can visualizar posicao consolidada de investimentos no mes.
- [ ] **INV-04**: User can ver impacto resumido de investimentos no panorama financeiro geral.

### API Quality & Reliability

- [ ] **API-01**: User receives mensagens de erro consistentes e amigaveis para falhas operacionais da API.
- [ ] **API-02**: Sistema valida payloads de entrada e rejeita dados invalidos com contrato padrao.
- [ ] **API-03**: Estrutura da API fica modular (routes/controllers/services) para manutencao e evolucao.

## Future Requirements

- **WISH-01**: Wishlist com prioridade e valor alvo (deferido)
- **WISH-02**: Simulador de impacto da wishlist no saldo livre (deferido)
- **AUTO-01**: Importacao Open Finance (deferido)

## Out of Scope (v1.1)

| Feature | Reason |
|---------|--------|
| App mobile nativo | Web mobile-first segue suficiente no ciclo atual |
| Multiusuario com perfis | Nao necessario para validar motor financeiro reestruturado |
| Trading avancado | Fora do foco de financas domesticas |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCH-01 | Phase 7 | Planned |
| SCH-02 | Phase 7 | Planned |
| SCH-03 | Phase 7 | Planned |
| SCH-04 | Phase 7 | Planned |
| API-01 | Phase 8 | Planned |
| API-02 | Phase 8 | Planned |
| API-03 | Phase 8 | Planned |
| INV-01 | Phase 9 | Planned |
| INV-02 | Phase 9 | Planned |
| INV-03 | Phase 9 | Planned |
| INV-04 | Phase 9 | Planned |

---
*Last updated: 2026-03-03 for v1.1 initialization*
