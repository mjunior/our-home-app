# Requirements: Nosso Lar Financeiro (v1.2)

**Defined:** 2026-03-03
**Milestone:** v1.2 Ui improvements and Import
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo

## v1.2 Requirements

### Home UX and Visual Clarity

- [x] **UI-01**: User can ver apenas um titulo principal de Fluxo de Caixa na tela inicial, sem duplicacao de heading.
- [x] **UI-02**: User can navegar entre meses com botoes alinhados visualmente e consistentes em desktop e mobile.
- [x] **UI-03**: User can ler o extrato mensal em tabela mais legivel, com melhor espacamento e hierarquia visual.
- [x] **UI-04**: User can ver datas do extrato no formato `DD/MM`, sem exibir o ano na listagem padrao.

### Transaction Import by Textarea

- [ ] **IMP-01**: User can abrir um fluxo de importacao por textarea para inserir varias transacoes, uma por linha.
- [ ] **IMP-02**: Sistema interpreta linhas no formato `data tipo descricao valor categoria conta recorrente`, com exemplo `01/02 saida compra_bahamas 50.00 mercado c6 recorrente`.
- [ ] **IMP-03**: User can visualizar erros de parsing por linha invalida sem perder as linhas validas.
- [ ] **IMP-04**: User can confirmar importacao e criar todos os lancamentos validos de uma vez.
- [ ] **IMP-05**: Campo `recorrente` aceita valores equivalentes para sim/nao e converte para o modelo interno corretamente.

## Future Requirements

- **API-01**: Padronizar mensagens de erro amigaveis em todos os endpoints core (deferido)
- **API-02**: Validacao de payload com contrato padrao em toda API (deferido)
- **WISH-01**: Wishlist com prioridade e valor alvo (deferido)
- **WISH-02**: Simulador de impacto da wishlist no saldo livre (deferido)
- **AUTO-01**: Importacao Open Finance (deferido)

## Out of Scope (v1.2)

| Feature | Reason |
|---------|--------|
| Integracao bancaria automatica (Open Finance) | Este ciclo foca em importacao manual rapida por texto |
| Assistente de categorizacao por IA | Aumenta escopo e risco; manter parser deterministico primeiro |
| Editor em massa de lancamentos apos import | Nao necessario para validar valor do fluxo inicial de import |
| Novo redesign completo da aplicacao | O foco e ajuste pontual da home, sem reescrever design system |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UI-01 | Phase 10 | Completed |
| UI-02 | Phase 10 | Completed |
| UI-03 | Phase 10 | Completed |
| UI-04 | Phase 10 | Completed |
| IMP-01 | Phase 11 | Pending |
| IMP-02 | Phase 11 | Pending |
| IMP-03 | Phase 11 | Pending |
| IMP-04 | Phase 11 | Pending |
| IMP-05 | Phase 11 | Pending |

**Coverage:**
- v1.2 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after phase 10 execution complete*
