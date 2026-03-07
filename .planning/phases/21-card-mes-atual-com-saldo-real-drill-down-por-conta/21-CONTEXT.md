# Phase 21: Card Mes Atual com Saldo Real + Drill-down por Conta - Context

**Gathered:** 2026-03-07
**Status:** Ready for planning
**Source:** Conversa de milestone v1.6 + roadmap/requirements

<domain>
## Phase Boundary

Entregar leitura operacional do mes atual separando `Saldo atual` (real, no momento) de `Saldo previsto` (fim do mes), com detalhamento por conta no clique do saldo e acoes de quitacao no extrato sem regressao no card de proximo mes.
</domain>

<decisions>
## Implementation Decisions

### Locked Decisions
- Card `Mes atual` deve mostrar explicitamente dois valores: `Saldo` e `Saldo previsto`.
- `Saldo` usa base operacional (itens pagos/recebidos e faturas quitadas).
- Clique em `Saldo` abre composicao por conta (lista de contas e respectivos saldos).
- Card `Proximo mes` permanece como projecao (sem mudar semantica atual).
- Extrato continua com acao direta de quitacao (`checkbox`) para itens elegiveis.
- Check/uncheck precisa refletir imediatamente no saldo atual e no drill-down.

### Claude's Discretion
- Reaproveitar endpoints existentes (`/api/accounts/consolidated` e `/api/free-balance`) em vez de criar API nova, salvo necessidade tecnica.
- Definir apresentacao visual do bloco `Saldo` vs `Saldo previsto` preservando linguagem do design system atual.
- Ajustar cobertura de testes para proteger regressao do card de proximo mes.
</decisions>

<specifics>
## Specific Ideas

- Usar `accountsController.getConsolidatedBalance` como fonte para `Saldo` atual e detalhes por conta.
- Usar `freeBalanceController.getFreeBalance` como fonte de `Saldo previsto` e sinal de risco/projecao.
- Manter navegação/ações existentes no extrato e apenas reforcar semantica visual/operacional.
</specifics>

<deferred>
## Deferred Ideas

- Projecao intradiaria por data de vencimento dentro do mes.
- Modo de conciliacao bancaria automatica.
- Quitacao parcial de faturas/compromissos com rateio.
</deferred>

---

*Phase: 21-card-mes-atual-com-saldo-real-drill-down-por-conta*
*Context gathered: 2026-03-07*
