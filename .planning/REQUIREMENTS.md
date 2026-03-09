# Requirements: Nosso Lar Financeiro

**Defined:** 2026-03-09
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## v1 Requirements

### Investment Goals

- [ ] **INVG-01**: Usuario pode informar uma meta financeira opcional ao criar conta do tipo `INVESTMENT`.
- [ ] **INVG-02**: Usuario pode editar a meta de uma conta de investimento existente.
- [ ] **INVG-03**: Sistema persiste a meta separadamente do saldo inicial e do saldo calculado da conta.
- [ ] **INVG-04**: Card/listagem de conta investimento exibe meta, saldo atual e quanto falta para atingir o objetivo.
- [ ] **INVG-05**: Sistema mostra progresso percentual da meta sem exibir valor faltante negativo quando o objetivo ja foi atingido.

### Cashflow Month Navigation

- [ ] **NAV-01**: Usuario consegue avancar e voltar meses no cashflow por controles explicitos de navegacao.
- [ ] **NAV-02**: Mes ativo no seletor mensal fica visualmente destacado de forma inequívoca.
- [ ] **NAV-03**: Itens e controles de navegacao mensal possuem estados visuais de hover, foco e pressed/coleta de clique.

### Transaction Submission Feedback

- [ ] **TXF-01**: Ao enviar novo lancamento, formulario mostra estado visual de processamento ate a conclusao.
- [ ] **TXF-02**: Acao primaria de cadastro de lancamento evita duplo clique/submissao duplicada enquanto processa.
- [ ] **TXF-03**: Botoes e CTAs do fluxo de lancamento comunicam clicabilidade com estados coerentes de hover, foco e clique.

## v2 Requirements

### Investment Goal Extensions

- **IGX-01**: Definir aporte mensal recomendado para atingir a meta em uma data alvo.
- **IGX-02**: Mostrar historico/evolucao temporal do progresso da meta.
- **IGX-03**: Permitir mais de uma meta por conta de investimento.

### Interaction Hardening

- **UXH-01**: Padronizar loading/sucesso/erro para todos os formularios da fundacao.
- **UXH-02**: Adicionar feedback visual consistente para acoes operacionais fora do cashflow (cartoes, categorias, contas).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Meta por transacao individual de investimento | O pedido e por conta de investimento, nao por aporte |
| Recomendacao automatica de quanto investir por mes | Exige modelagem adicional de prazo e simulacao |
| Redesign geral do cashflow | Escopo deste milestone e feedback/interacao, nao reestruturacao total da tela |
| Notificacoes de meta atingida | Valor adicional menor que a base de meta + progresso neste ciclo |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INVG-01 | Phase 22 | In Progress |
| INVG-02 | Phase 22 | In Progress |
| INVG-03 | Phase 22 | In Progress |
| INVG-04 | Phase 22 | In Progress |
| INVG-05 | Phase 22 | In Progress |
| NAV-01 | Phase 23 | Pending |
| NAV-02 | Phase 23 | Pending |
| NAV-03 | Phase 23 | Pending |
| TXF-01 | Phase 23 | Pending |
| TXF-02 | Phase 23 | Pending |
| TXF-03 | Phase 23 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-09*
*Last updated: 2026-03-09 after v1.7 milestone definition*
