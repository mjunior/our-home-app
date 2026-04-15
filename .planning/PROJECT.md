# Nosso Lar Financeiro

## What This Is

Aplicativo web de gestao financeira domestica, mobile-first, focado em decisao operacional de caixa com saldo livre explicavel, compromissos futuros previsiveis e separacao correta entre consumo e investimento.

Agora o foco evolui para permitir sincronizacao manual entre o app e a realidade da carteira/banco, criando reajustes explicitos quando o saldo de uma conta ou a fatura de um cartao divergir do valor real informado pelo usuario.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.8 Reajuste de Conta e Cartao

**Goal:** Permitir que o usuario informe o valor real de uma conta ou fatura de cartao e o sistema crie automaticamente um lancamento de reajuste positivo ou negativo para igualar o app ao banco.

**Target features:**
- Reajuste manual de saldo em conta a partir do valor real informado, data escolhida e diferenca calculada pelo sistema.
- Reajuste manual de fatura de cartao a partir do valor real da fatura no mes informado.
- Lancamento `REAJUSTE` positivo ou negativo gerado automaticamente para sincronizar o app com a carteira real.
- Preview claro antes da gravacao mostrando valor no app, valor real informado e diferenca que sera lancada.
- Rastreabilidade do reajuste no extrato/fatura sem criar sincronizacao bancaria automatica.

## Requirements

### Validated

- ✓ Fluxo unificado de lancamentos (avulso/recorrente/parcelado/investimento) — v1.1
- ✓ Home de cashflow refinada com navegacao mensal consistente — v1.2
- ✓ Importacao textual em lote com parser e persistencia parcial — v1.2
- ✓ Autenticacao por conta com isolamento de dados por `userId` — v1.3
- ✓ Cartao por fatura no fluxo de caixa com regra de fechamento/vencimento — v1.4
- ✓ UX operacional de faturas no modulo de cartoes — v1.5
- ✓ Controle `PAGO`/`NAO_PAGO` para contas/faturas com saldo atual separado do previsto — v1.6

### Active

- [ ] ACADJ-01: Usuario pode iniciar reajuste para uma conta informando conta, valor real, data e mes de competencia.
- [ ] ACADJ-02: Sistema calcula a diferenca entre saldo da conta no app e valor real informado.
- [ ] ACADJ-03: Sistema cria lancamento unico `REAJUSTE` positivo ou negativo na data escolhida para igualar a conta ao valor real.
- [ ] ACADJ-04: Reajuste de conta impacta saldo atual/previsto de forma consistente com a data e o status operacional do lancamento.
- [ ] CCADJ-01: Usuario pode iniciar reajuste para um cartao informando cartao, mes da fatura, data do lancamento e valor real da fatura.
- [ ] CCADJ-02: Sistema compara o total atual da fatura no app com o valor real informado.
- [ ] CCADJ-03: Sistema cria lancamento unico `REAJUSTE` positivo ou negativo na fatura correta para igualar a fatura ao valor real.
- [ ] CCADJ-04: Reajuste de cartao respeita a competencia da fatura informada e aparece no modulo de cartoes e no cashflow consolidado.
- [ ] ADJ-01: Usuario ve preview antes de salvar com valor no app, valor real informado e diferenca calculada.
- [ ] ADJ-02: Sistema trata diferenca zero como caso sem lancamento necessario.
- [ ] ADJ-03: Reajustes ficam identificaveis como `REAJUSTE` para auditoria, edicao/exclusao e entendimento futuro.

### Out of Scope

- Sincronizacao automatica com banco, Open Finance, API bancaria ou scraping.
- Importacao de extrato para reconciliar transacoes uma a uma.
- Algoritmo para distribuir diferenca entre categorias ou compras originais.
- Conciliacao automatica multi-conta/multi-cartao em lote.
- Recalculo retroativo de faturas ja fechadas fora do mes escolhido pelo usuario.

## Context

- v1.6 separou saldo atual e saldo previsto, com quitacao operacional para contas e faturas.
- v1.7 implementou metas em contas de investimento e feedback operacional no cashflow, mas a verificacao automatizada ainda esta pendente no ambiente registrado anteriormente.
- O app ja possui lancamentos em conta, transacoes de cartao, agrupamento por fatura e consolidado de fatura no cashflow.
- O problema deste milestone e operacional: quando o banco/carteira real diverge do app, o usuario precisa conseguir ajustar o app sem inventar manualmente o sinal e o valor da diferenca.
- Reajuste e uma correcao explicita de sincronizacao manual, nao uma tentativa de reconciliar a origem exata da divergencia.

## Constraints

- **Financial Logic**: O sistema deve calcular o sinal do reajuste; o usuario informa o valor real final, nao a diferenca.
- **Auditability**: Todo reajuste precisa virar lancamento explicito `REAJUSTE`, rastreavel e reversivel.
- **Invoice Scope**: Reajuste de cartao deve atingir a fatura do mes informado, sem espalhar ajuste por outros ciclos.
- **Account Scope**: Reajuste de conta deve afetar apenas a conta escolhida.
- **No Bank Integration**: Este milestone nao adiciona integracao bancaria; a sincronizacao e manual.
- **User Isolation**: Todos os calculos e lancamentos continuam restritos ao `userId` autenticado.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Usuario informa valor real final, nao diferenca | Reduz erro operacional de sinal e transforma o app em comparador contra a carteira real | — Pending |
| Reajuste vira lancamento `REAJUSTE` explicito | Mantem auditoria, permite edicao/exclusao e evita correcao invisivel no saldo | — Pending |
| Cartao compara contra a fatura do mes informado | A divergencia pratica do cartao acontece na fatura, nao no limite total do cartao | — Pending |
| Diferenca zero nao deve gerar lancamento | Evita ruido no historico quando app e banco ja estao sincronizados | — Pending |

## Milestone History

- `v1.0` roadmap/requirements: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`
- `v1.1` roadmap/requirements: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`
- `v1.2` roadmap/requirements: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`
- `v1.4` roadmap: `.planning/milestones/v1.4-ROADMAP.md`
- `v1.5` roadmap/requirements: `.planning/milestones/v1.5-ROADMAP.md`, `.planning/milestones/v1.5-REQUIREMENTS.md`

---
*Last updated: 2026-04-15 after v1.8 milestone start*
