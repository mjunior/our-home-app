# Nosso Lar Financeiro

## What This Is

Aplicativo web para organizar a vida financeira da casa em um único lugar. O foco inicial é controlar contas, cartões de crédito, fluxo de caixa, investimentos e lista de desejos de compras. O produto foi pensado para uso doméstico, com visão prática e diária de quanto ainda é seguro gastar.

## Core Value

Mostrar com clareza o saldo livre do mês atual e do próximo mês para evitar ficar no negativo.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Consolidar saldos de contas e cartões
- [ ] Registrar entradas e saídas com categorização
- [ ] Tratar compras parceladas e despesas recorrentes
- [ ] Acompanhar investimentos básicos
- [ ] Exibir saldo livre atual e projetado

### Out of Scope

- Conciliação bancária automática via Open Finance — adiado para reduzir complexidade inicial
- Aplicativos mobile nativos (iOS/Android) — versão web primeiro para validar fluxo

## Context

- Produto doméstico para gestão financeira familiar.
- Escopo funcional inicial: contas, faturas de cartão, despesas, receitas, categorias, recorrência, parcelamento, investimentos e wishlist.
- Métrica principal de sucesso: tomar decisões de gasto com base no saldo livre confiável.

## Constraints

- **Delivery**: MVP funcional primeiro — validar rotina de uso antes de avançar para integrações externas.
- **UX**: Interface simples e direta — uso recorrente no dia a dia da casa.
- **Data Integrity**: Cálculos financeiros rastreáveis — evitar inconsistências em parcelas e projeções.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Priorizar saldo livre como métrica principal | É o objetivo explícito de decisão financeira mensal | — Pending |
| Começar com lançamentos manuais | Reduz dependência de integrações externas na fase inicial | — Pending |
| Suportar conta e cartão no mesmo fluxo de despesa | Evita duplicidade de modelagem e melhora visão consolidada | — Pending |

---
*Last updated: 2026-03-02 after initialization*
