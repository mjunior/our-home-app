# Nosso Lar Financeiro

## What This Is

Aplicativo web de gestao financeira domestica, mobile-first, focado em decisao operacional de caixa com saldo livre explicavel, compromissos futuros previsiveis e separacao correta entre consumo e investimento.

Neste milestone, o produto evolui a logica de cartao de credito para trabalhar por fatura (fechamento e vencimento), removendo ruido de compras individuais do fluxo de caixa principal.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.4 Faturas de Cartao no Fluxo de Caixa

**Goal:** Tratar despesas de cartao por ciclo de fatura e exibir no cashflow apenas eventos de fatura consolidada por cartao.

**Target features:**
- Regra de competencia de cartao por fechamento configuravel (compra no dia do fechamento entra na fatura seguinte).
- Fatura com dia de pagamento configuravel por cartao.
- Fluxo de caixa consolidado por fatura (nao listar compras individuais de cartao no extrato principal).
- Tela de cartao com lista de faturas mensais e acesso aos lancamentos individuais.

## Requirements

### Validated

- ✓ Fluxo unificado de lancamentos (avulso/recorrente/parcelado/investimento) — v1.1
- ✓ Home de cashflow refinada com navegacao mensal consistente — v1.2
- ✓ Importacao textual em lote com parser e persistencia parcial — v1.2
- ✓ Autenticacao por conta com isolamento de dados por `userId` — v1.3

### Active

- [ ] Compra em cartao no dia de fechamento deve ser atribuida para a fatura do mes seguinte.
- [ ] Fluxo de caixa nao deve listar compras individuais de cartao; deve listar somente faturas consolidadas por cartao.
- [ ] Fatura consolidada deve entrar no fluxo no dia de pagamento configurado do cartao.
- [ ] Tela de cartao deve listar faturas por mes com total e permitir abrir/editar despesas individuais.

### Out of Scope

- Parcelamento automatico de pagamento minimo/rotativo de fatura — fora do escopo deste milestone.
- Integracao bancaria/Open Finance para leitura de faturas — fora do escopo deste milestone.
- Notificacao push de vencimento — adiar para milestone dedicado de notificacoes.

## Context

- Ultima versao entregue: `v1.3` (2026-03-05), com login e isolamento de dados.
- O dominio ja possui `closeDay` e `dueDay` por cartao, mas o extrato principal ainda mistura compras individuais de cartao com demais despesas.
- O proximo passo e separar visao operacional de caixa (faturas) da visao analitica por compra (modulo de cartoes).

## Constraints

- **Financial Logic**: Compra realizada no dia do fechamento pertence a fatura seguinte — regra contabil explicita do produto.
- **UX**: Fluxo de caixa deve reduzir ruido e mostrar somente compromissos reais de pagamento no mes.
- **Consistency**: Valores de fatura devem manter rastreabilidade para despesas individuais editaveis no modulo de cartoes.
- **Compatibility**: Mudanca nao pode quebrar despesas em conta corrente, recorrencias e parcelas ja existentes.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| No cashflow principal, cartao entra como fatura consolidada e nao por compra individual | A visao operacional deve refletir obrigacoes de pagamento, nao granularidade de consumo | — Pending |
| Competencia da compra de cartao usa regra de fechamento com corte inclusivo (dia do fechamento vai para proxima fatura) | Requisito explicito do usuario para previsibilidade | — Pending |
| Tela de cartao sera a fonte de verdade para detalhe por despesa/fatura | Separa contexto operacional (caixa) de contexto analitico (cartao) | — Pending |

## Milestone History

- `v1.0` roadmap/requirements: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`
- `v1.1` roadmap/requirements: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`
- `v1.2` roadmap/requirements: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`
- `v1.3` roadmap/requirements: `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md` (antes do refresh para v1.4)

---
*Last updated: 2026-03-06 after milestone v1.4 initialization*
