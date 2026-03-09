# Nosso Lar Financeiro

## What This Is

Aplicativo web de gestao financeira domestica, mobile-first, focado em decisao operacional de caixa com saldo livre explicavel, compromissos futuros previsiveis e separacao correta entre consumo e investimento.

Agora o foco evolui para tornar investimentos mais orientados a objetivo e deixar a operacao do cashflow mais clara nas interacoes do dia a dia, especialmente ao trocar de mes e cadastrar lancamentos.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.7 Objetivos de Investimento e Feedback Operacional

**Goal:** Dar contexto de progresso para contas de investimento e melhorar feedback visual nas interacoes principais do cashflow.

**Target features:**
- Conta de investimento com `amount goal` opcional e calculo de quanto falta para atingir a meta.
- Visualizacao do progresso da meta diretamente no modulo de contas/investimentos.
- Navegacao mensal do cashflow com controles e estados visuais mais claros.
- Cadastro de transacao com feedback visual de clique/envio para reforcar a acao do usuario.

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

- [ ] INVG-01: Conta de investimento aceita meta financeira opcional (`amount goal`) no cadastro e edicao.
- [ ] INVG-02: Modulo de contas mostra valor alvo, saldo atual, progresso e quanto falta para a meta.
- [ ] INVG-03: Meta atingida nao exibe valor faltante negativo e comunica claramente quando foi concluida.
- [ ] NAV-01: Cashflow permite navegar entre meses com controles anteriores/proximos mais evidentes.
- [ ] NAV-02: Navegacao mensal tem estados visuais claros de hover, ativo, foco e clique.
- [ ] TXF-01: Cadastro de transacao mostra estado visual de envio/clique e evita submissao duplicada.
- [ ] TXF-02: Acoes primarias do fluxo de cadastro parecem clicaveis e mantem feedback coerente com o design atual.

### Out of Scope

- Planejamento de aportes mensais para bater a meta automaticamente.
- Multiplas metas por conta de investimento.
- Alertas/notificacoes quando a meta estiver proxima ou for atingida.
- Refactor visual completo do cashflow fora dos pontos de navegacao e feedback operacional.

## Context

- v1.6 concluiu a separacao entre saldo atual e saldo previsto, alem da quitacao operacional de contas e faturas.
- O modulo de contas ja diferencia `CHECKING` e `INVESTMENT`, mas conta investimento ainda nao carrega nenhum contexto de objetivo/meta.
- A navegacao mensal do cashflow funciona, porem depende muito do rail horizontal e carece de pistas mais claras de clicabilidade/estado.
- Formularios como cadastro de conta e lancamento ainda usam controles com pouco feedback visual em alguns pontos, especialmente durante submissao.

## Constraints

- **Financial Logic**: Meta de investimento e informativa; nao pode alterar calculo de saldo real nem de saldo previsto.
- **Account Scope**: `amount goal` se aplica apenas a contas `INVESTMENT`, sem impactar contas correntes.
- **UX**: Melhorias de feedback precisam preservar a linguagem visual ja existente, sem criar um segundo sistema de componentes.
- **Compatibility**: Navegacao mensal e fluxo de cadastro precisam continuar funcionando em mobile e desktop.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Meta fica no nivel da conta de investimento, nao em transacoes isoladas | O objetivo e acompanhar progresso do patrimonio daquela conta especifica | — Pending |
| Progresso da meta deve usar saldo atual da conta como base | Evita duplicar logica e mantem coerencia com o consolidado de contas | — Pending |
| Melhorias de feedback focam em navegacao mensal e submissao de lancamentos neste milestone | Resolve o atrito operacional citado sem abrir um redesign amplo | — Pending |

## Milestone History

- `v1.0` roadmap/requirements: `.planning/milestones/v1.0-ROADMAP.md`, `.planning/milestones/v1.0-REQUIREMENTS.md`
- `v1.1` roadmap/requirements: `.planning/milestones/v1.1-ROADMAP.md`, `.planning/milestones/v1.1-REQUIREMENTS.md`
- `v1.2` roadmap/requirements: `.planning/milestones/v1.2-ROADMAP.md`, `.planning/milestones/v1.2-REQUIREMENTS.md`
- `v1.4` roadmap: `.planning/milestones/v1.4-ROADMAP.md`
- `v1.5` roadmap/requirements: `.planning/milestones/v1.5-ROADMAP.md`, `.planning/milestones/v1.5-REQUIREMENTS.md`

---
*Last updated: 2026-03-09 after v1.7 milestone start*
