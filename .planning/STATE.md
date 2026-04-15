---
gsd_state_version: 1.0
milestone: v1.8
milestone_name: Reajuste de Conta e Cartao
status: phase_planned
last_updated: "2026-04-15T00:00:00.000Z"
progress:
  total_phases: 27
  completed_phases: 22
  total_plans: 77
  completed_plans: 68
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-15)

**Core value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.
**Current focus:** milestone v1.8 definido para reajuste manual de conta e cartao a partir do valor real informado pelo usuario.

## Current Position

Phase: 24 - reajuste de saldo em conta
Plan: 24-01, 24-02, 24-03 planned
Status: Phase 24 planned; ready for execution.
Last activity: 2026-04-15 — Phase 24 planned with 3 sequential plans for account balance adjustment.

Progress: [░░░░░░░░░░] 0% do milestone v1.8

## Accumulated Context

### Decisions

- Regra de ciclo de fatura consolidada: `day < closeDay` na competencia corrente e `day >= closeDay` na seguinte.
- Fluxo de caixa principal mostra obrigacoes de fatura consolidadas por cartao no vencimento.
- Modulo de cartoes e a fonte de verdade para itens individuais de cada fatura.
- Novo milestone adiciona semantica operacional de quitacao para separar saldo real de saldo previsto.
- Transacoes de conta agora aceitam settlementStatus (`PAID`/`UNPAID`) com impacto direto no saldo operacional.
- Faturas de cartao podem ser quitadas/desquitadas por (`cardId`, `dueMonth`) com conta pagadora e data de pagamento.
- Card de mes atual passou a separar `Saldo` real de `Saldo previsto`, com drill-down por conta no clique.
- Gap closure 21.1 reforcou entrada principal pelo clique no proprio `Saldo` (mantendo atalho auxiliar).
- Proximo milestone vai adicionar objetivo financeiro diretamente na conta `INVESTMENT`, sem alterar calculo de saldo.
- Proximo milestone tambem foca em tornar navegacao mensal e submissao de lancamentos visualmente mais evidentes.
- Phase 22 implementou `goalAmount` opcional em contas `INVESTMENT` com progresso, faltante e estado de objetivo concluido.
- Edicao de objetivo existente ficou concentrada em um Sheet dedicado na tela de contas.
- Verificacao automatizada da fase ficou bloqueada porque o ambiente atual nao possui `node`/`npm` no PATH.
- Phase 23 adicionou botoes explicitos de navegacao mensal e reforcou estados visuais do rail do cashflow.
- Modal de novo lancamento agora mostra `Salvando...`, desabilita tabs/campos durante envio e evita submit duplicado.
- Reajuste manual deve receber o valor real final e calcular automaticamente a diferenca positiva/negativa.
- Reajuste deve ser lancamento explicito `REAJUSTE`, nao alteracao invisivel de saldo.
- Reajuste de cartao deve comparar contra a fatura do mes informado e lancar na data escolhida.
- Reajuste de conta deve comparar contra a conta escolhida e lancar na data escolhida.

### Roadmap Evolution

- Milestone v1.4 archived: `.planning/milestones/v1.4-ROADMAP.md`
- Milestone v1.5 archived: `.planning/milestones/v1.5-ROADMAP.md`
- Milestone v1.6 initialized: phases 19-21 em `.planning/ROADMAP.md`
- Phase 19 completed: modelo de quitacao para lancamentos em conta
- Phase 20 completed: quitacao de fatura consolidada de cartao
- Phase 21 completed: saldo atual x previsto e composicao por conta
- Phase 21.1 completed: fechamento do gap BAL-03 (gatilho de drill-down no saldo)
- Milestone v1.7 initialized: phases 22-23 em `.planning/ROADMAP.md`
- Phase 22 implemented: goalAmount em contas de investimento com create/edit/read e visualizacao de progresso
- Phase 23 implemented: navegacao mensal explicita e feedback operacional no cadastro de lancamentos
- Milestone v1.8 initialized: reajuste manual de conta e cartao para sincronizar app com carteira real.
- Phase 24 planned: reajuste de saldo em conta.
- Phase 25 planned: reajuste de fatura de cartao.
- Phase 26 planned: preview, auditoria e salvaguardas de reajuste.
- Phase 24 plan split: dominio/testes, API/runtime, UI/teste e2e.

### Pending Todos

- Verificar Phases 22 e 23 assim que `node`/`npm` estiverem disponiveis no ambiente.
- Avaliar fechamento formal do milestone v1.7 apos verificacao.
- Executar Phase 24 do milestone v1.8.

### Blockers/Concerns

- `npm run lint` ainda bloqueado por tipagem PWA preexistente (`virtual:pwa-register` em `src/main.tsx`).
- v1.7 permanece implementado, mas sem arquivamento formal em `MILESTONES.md`.

## Session Continuity

Last session: 2026-04-15
Stopped at: Phase 24 planejada; pronto para execucao
Resume file: .planning/phases/24-reajuste-de-saldo-em-conta/24-01-PLAN.md
