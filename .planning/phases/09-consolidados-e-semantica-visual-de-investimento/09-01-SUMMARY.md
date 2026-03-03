---
phase: 09-consolidados-e-semantica-visual-de-investimento
plan: "01"
subsystem: api
tags: [cashflow, investment, accounts, aggregation, free-balance]
requires: []
provides:
  - Separacao contabil de gastos operacionais vs investimentos no motor de saldo livre
  - Consolidado de contas por tipo e por conta com saldo calculado por movimentacao
  - Contrato de API de contas com totals coerentes para transferencia interna
affects: [cashflow, accounts, statement]
tech-stack:
  added: []
  patterns:
    - buckets-contabeis-explicitos-no-breakdown
    - consolidado-por-conta-com-net-de-transacoes
key-files:
  created: []
  modified:
    - src/modules/free-balance/free-balance.types.ts
    - src/modules/free-balance/free-balance.service.ts
    - src/server/vite-api.ts
    - src/modules/accounts/accounts.service.ts
    - src/app/foundation/runtime.ts
    - tests/modules/free-balance.service.test.ts
    - tests/modules/foundation-api.test.ts
key-decisions:
  - "Investimento foi classificado via expense com transferGroupId e somado em bucket dedicado"
  - "Consolidado de contas usa saldo atual (abertura + net de transacoes por conta) mantendo amount total"
patterns-established:
  - "Free balance deve expor campos legados e novos buckets para migracao progressiva de UI"
  - "Transferencia interna muda byType e account-level sem inflar total consolidado"
requirements-completed: [INV-03, ACC-03]
duration: 20min
completed: 2026-03-03
---

# Phase 09: Consolidados e Semantica Visual de Investimento Summary

**Motor de saldo livre com buckets separados de investimento e consolidado de contas por tipo/conta sem dupla contagem de transferencia interna**

## Performance

- **Duration:** 20 min
- **Started:** 2026-03-03T16:33:00Z
- **Completed:** 2026-03-03T16:53:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Separei `gastosOperacionais`, `investimentos` e `totalSaidas` no breakdown mensal do free balance.
- Mantive impacto do investimento no saldo livre, mas fora do bucket operacional.
- Expandi o consolidado de contas para retornar `amount`, `byType` e `accounts` com saldo por conta baseado nas movimentacoes.

## Task Commits

Each task was committed atomically:

1. **Task 1: Evoluir tipos e agregacoes do saldo livre para separar investimento** - `e5b2d74` (feat)
2. **Task 2: Ajustar consolidado de contas por tipo sem dupla contagem** - `d3b03e7` (feat)

## Files Created/Modified
- `src/modules/free-balance/free-balance.types.ts` - adiciona campos de breakdown para separacao operacional/investimento.
- `src/modules/free-balance/free-balance.service.ts` - separa despesas avulsas de investimento e calcula novos totais.
- `tests/modules/free-balance.service.test.ts` - cobre novos buckets e cenario com transferencia de investimento.
- `src/modules/accounts/accounts.service.ts` - consolidado com saldo atual por conta e subtotal por tipo.
- `src/server/vite-api.ts` - endpoint `/api/accounts/consolidated` retorna contrato expandido com byType/accounts.
- `src/app/foundation/runtime.ts` - runtime local passa a calcular consolidado usando transacoes.
- `tests/modules/foundation-api.test.ts` - valida invariancia do total em transferencia interna e variacao por tipo/conta.

## Decisions Made
- Mantive `obligations` para compatibilidade e adicionei novos buckets para consumo gradual pela UI.
- O saldo consolidado passou a refletir saldo atual (nao apenas saldo inicial) para viabilizar leitura operacional por conta.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Ajuste de expectativa de teste para vencimento de fatura no mes seguinte**
- **Found during:** Task 1
- **Issue:** Assert de `gastosOperacionais` considerava a compra no cartao no mes atual, mas a fatura vence no proximo mes.
- **Fix:** Corrigi expectativa para `700.00` no mes atual.
- **Files modified:** tests/modules/free-balance.service.test.ts
- **Verification:** `npm run test -- tests/modules/free-balance.service.test.ts`
- **Committed in:** e5b2d74

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Sem impacto de escopo; apenas alinhamento com regra contábil já existente.

## Issues Encountered
- Nenhum bloqueio adicional.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Base de dominio/API pronta para onda 2 consumir os novos buckets no Cashflow.
- Contrato de contas pronto para cards por conta e por tipo na tela de Contas.

---
*Phase: 09-consolidados-e-semantica-visual-de-investimento*
*Completed: 2026-03-03*
