# Nosso Lar Financeiro

## What This Is

Aplicativo web de gestao financeira domestica, mobile-first, focado em decisao operacional de caixa com saldo livre explicavel, compromissos futuros previsiveis e separacao correta entre consumo e investimento.

Agora o foco evolui para diferenciar compromisso planejado de compromisso quitado, mostrando no cashflow o saldo atual real das contas e mantendo o saldo previsto separado.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.6 Controle de Pagamentos e Saldo Atual

**Goal:** Incluir controle pago/nao pago para contas e faturas, e exibir no card de mes atual o saldo real no momento com detalhamento por conta.

**Target features:**
- Status `PAGO`/`NAO_PAGO` para compromissos que impactam conta corrente/investimento.
- Fatura de cartao quitada como bloco unico (sem quitar compra individual no cashflow).
- Card `Mes atual` com `Saldo` (real) + `Saldo previsto` (fim do mes) separados.
- Drill-down do `Saldo` atual mostrando composicao por conta.

## Requirements

### Validated

- ✓ Fluxo unificado de lancamentos (avulso/recorrente/parcelado/investimento) — v1.1
- ✓ Home de cashflow refinada com navegacao mensal consistente — v1.2
- ✓ Importacao textual em lote com parser e persistencia parcial — v1.2
- ✓ Autenticacao por conta com isolamento de dados por `userId` — v1.3
- ✓ Cartao por fatura no fluxo de caixa com regra de fechamento/vencimento — v1.4
- ✓ UX operacional de faturas no modulo de cartoes — v1.5

### Active

- [ ] PAY-01: Lancamento com destino em conta suporta status `PAGO`/`NAO_PAGO`.
- [ ] PAY-02: Lancamento `NAO_PAGO` nao altera saldo atual da conta; altera apenas ao marcar `PAGO`.
- [ ] INVP-01: Fatura de cartao e quitada como bloco (status unico da fatura no mes).
- [ ] INVP-02: Quitacao de fatura desconta total consolidado da conta de pagamento informada.
- [ ] BAL-01: Card `Mes atual` exibe `Saldo` real calculado a partir de itens pagos.
- [ ] BAL-02: Card `Mes atual` exibe `Saldo previsto` separadamente sem perder comportamento atual.
- [ ] BAL-03: Clique em `Saldo` abre composicao por conta (nome + saldo atual).
- [ ] BAL-04: Card `Proximo mes` permanece orientado a previsto, sem mistura com status pago.

### Out of Scope

- Pagamento parcial de fatura com saldo remanescente e rateio automatico entre contas.
- Juros de rotativo e parcelamento da propria fatura.
- Notificacoes de vencimento por push/email.

## Context

- v1.5 concluiu ciclo de fatura por fechamento/vencimento e UX de cartoes.
- O extrato principal hoje e fortemente previsto; falta leitura de posicao real (ja pago x ainda nao pago).
- O usuario precisa enxergar rapidamente o saldo real do momento sem perder a projecao ate o fim do mes.

## Constraints

- **Financial Logic**: Item `NAO_PAGO` nao pode reduzir saldo atual da conta antes da quitacao.
- **Credit Card**: Quitacao acontece por fatura consolidada, nao por compra individual no cashflow principal.
- **UX**: Saldo atual e saldo previsto devem ser exibidos de forma explicita e sem ambiguidade.
- **Compatibility**: Card de proximo mes continua representando previsao.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Introduzir semantica de pagamento (`PAGO`/`NAO_PAGO`) para compromissos em conta | Separar fluxo operacional realizado da projecao de compromissos | — Pending |
| Quitacao de cartao no cashflow e por fatura consolidada | Coerencia com a modelagem ja adotada nas fases 15-18 | — Pending |
| Card `Mes atual` deve separar `Saldo` real de `Saldo previsto` | Permitir leitura imediata de onde o usuario esta agora | — Pending |

## Milestone History

- `v1.0` roadmap/requirements: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`
- `v1.1` roadmap/requirements: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`
- `v1.2` roadmap/requirements: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`
- `v1.4` roadmap: `.planning/milestones/v1.4-ROADMAP.md`
- `v1.5` roadmap/requirements: `.planning/milestones/v1.5-ROADMAP.md`, `.planning/milestones/v1.5-REQUIREMENTS.md`

---
*Last updated: 2026-03-07 after v1.6 milestone start*
