# Roadmap: Nosso Lar Financeiro (v1.1)

## Overview

Milestone focado em elevar robustez do nucleo financeiro: reestruturar recorrencias/parcelamentos, elevar qualidade da API e entregar investimentos sobre a base persistente.

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03)
- 🚧 **v1.1 Reestruturacao de Compromissos e Investimentos** — Phases 7-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP Finance Core (Phases 1-4.2) — SHIPPED 2026-03-03</summary>

- [x] Phase 1: Fundacao Financeira (3/3 plans)
- [x] Phase 2: Fluxo de Caixa e Faturas (3/3 plans)
- [x] Phase 3: Parcelas e Recorrencias (2/2 plans)
- [x] Phase 4: Motor de Saldo Livre (3/3 plans)
- [x] Phase 4.1: UI revamp mobile-first com shadcn (3/3 plans)
- [x] Phase 4.2: database persist (3/3 plans)

Arquivo detalhado: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Reestruturacao de Compromissos e Investimentos

- [ ] **Phase 7: Rebuild do Motor de Compromissos** - Reestruturar recorrencias/parcelamentos com modelo unificado e previsao confiavel.
- [ ] **Phase 8: Hardening da API Financeira** - Modularizar API, padronizar validacoes e contratos de erro.
- [ ] **Phase 9: Investimentos Integrados** - Entregar posicao/eventos de investimentos e consolidacao no panorama financeiro.

## Phase Details

### Phase 7: Rebuild do Motor de Compromissos
**Goal**: Reestruturar o dominio de recorrencias/parcelamentos para evolucao segura e previsao mensal consistente.
**Depends on**: Phase 4.2
**Requirements**: SCH-01, SCH-02, SCH-03, SCH-04
**Success Criteria** (what must be TRUE):
  1. User can cadastrar compromisso recorrente/parcela com regras consistentes em um unico fluxo.
  2. User can editar apenas obrigacoes futuras sem corromper historico fechado.
  3. User can ver previsao mensal clara com origem de cada obrigacao.
**Plans**: 3 plans

### Phase 8: Hardening da API Financeira
**Goal**: Elevar o padrao de qualidade da API para manutencao e confiabilidade de produto premium.
**Depends on**: Phase 7
**Requirements**: API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. Todos endpoints core retornam erros em contrato consistente e amigavel.
  2. Payloads invalidos sao bloqueados por validacao de entrada antes de atingir dominio.
  3. Estrutura da API fica modular e testavel por camada.
**Plans**: 2 plans

### Phase 9: Investimentos Integrados
**Goal**: Entregar modulo de investimentos util no dia a dia com consolidacao no panorama financeiro.
**Depends on**: Phase 8
**Requirements**: INV-01, INV-02, INV-03, INV-04
**Success Criteria** (what must be TRUE):
  1. User can cadastrar investimentos e registrar eventos de ciclo de vida.
  2. User can visualizar posicao consolidada de investimentos no mes.
  3. User can entender impacto resumido dos investimentos no panorama geral.
**Plans**: 3 plans

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. Rebuild do Motor de Compromissos | v1.1 | 0/3 | Not started | - |
| 8. Hardening da API Financeira | v1.1 | 0/2 | Not started | - |
| 9. Investimentos Integrados | v1.1 | 0/3 | Not started | - |
