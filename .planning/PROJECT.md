# Nosso Lar Financeiro

## What This Is

Aplicativo web para gestao financeira da casa, mobile-first, com foco em decisao de gasto a partir do saldo livre, fluxo de caixa confiavel e previsao de compromissos futuros.

## Core Value

Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## Current Milestone: v1.1 Reestruturacao de Lancamentos e Investimentos por Transferencia

**Goal:** Unificar o fluxo de novos lancamentos (recorrencia e parcelamento) e tratar investimento como transferencia entre contas sem distorcer leitura de gasto.

**Target features:**
- Fluxo unico de novo lancamento para recorrencia e parcelamento
- Investimento modelado como saida de origem e entrada de destino no mesmo evento
- Separacao contabil de investimento no resumo financeiro (sem vermelho de despesa operacional)
- Tipos de conta explicitos: CONTA_CORRENTE e CONTA_INVESTIMENTO

## Requirements

### Validated

- ✓ Fundacao financeira (contas, cartoes, categorias) — v1.0
- ✓ Fluxo de caixa e faturas — v1.0
- ✓ Motor inicial de recorrencias/parcelas — v1.0
- ✓ Dashboard de saldo livre atual e projetado — v1.0
- ✓ Persistencia SQLite/Prisma integrada ao runtime principal — v1.0

### Active

- [ ] Unificar criacao de recorrencia e parcelamento no mesmo fluxo de lancamento
- [ ] Reestruturar motor de compromissos para previsao e manutencao sem regressao
- [ ] Entregar investimento como transferencia entre contas com dupla entrada contabil
- [ ] Exibir investimento separado de despesas operacionais no panorama financeiro
- [ ] Consolidar tipos de conta para operacao financeira (CONTA_CORRENTE e CONTA_INVESTIMENTO)

### Out of Scope

- Integracao automatica Open Finance neste milestone
- Aplicativos mobile nativos
- Trading avancado / carteira de ativos de mercado
- Multiusuario com perfis e permissoes

## Context

- v1.0 shipado com UX mobile premium e persistencia real.
- O escopo foi refinado para atacar primeiro o modelo transacional: recorrencia e parcelamento sao tipos de transacao no mesmo fluxo.
- Investimento passa a ser tratado como movimentacao interna de patrimonio (saida de um lugar e entrada em outro), preservando leitura correta de gasto do mes.

## Constraints

- **Data Integrity**: edicoes devem preservar historico financeiro fechado e nao podem reescrever o passado.
- **Accounting Rule**: todo investimento deve gerar saida em origem e entrada em destino no mesmo evento atomico.
- **UX Semantics**: investimento nao deve aparecer como saida vermelha de despesa operacional.
- **Compatibility**: migracao do modelo deve manter dados existentes utilizaveis.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Recorrencia e parcelamento sao tipos de transacao no mesmo fluxo de criacao | Reduz duplicacao de regras e simplifica manutencao | — In Progress |
| Investimento sera registrado como transferencia interna (origem -> destino) | Evita tratar investimento como consumo e melhora consistencia contabil | — In Progress |
| Tipos de conta padrao para este ciclo: CONTA_CORRENTE e CONTA_INVESTIMENTO | Simplifica operacao e linguagem do produto para o contexto domestico | — In Progress |

---
*Last updated: 2026-03-03 after v1.1 scope refinement for transactions and investments*
