# Research Summary — Home Finance

## Stack

Monolito web tipado com React + TypeScript no frontend, backend Node.js + TypeScript e PostgreSQL como fonte única de verdade. Jobs assíncronos para materializar recorrências e parcelas.

## Table Stakes

Contas, cartões, lançamentos de receita/despesa, categorias, parcelamento, recorrência e visão clara do caixa/fatura.

## Architecture Direction

Separar módulos de ledger, cartões/contas, agenda financeira e cálculo de saldo livre. O motor de saldo livre deve consolidar mês atual e próximo mês com regras explícitas.

## Watch Out For

- Definições de saldo mal especificadas.
- Erros em parcelamento/recorrência sem idempotência.
- Falhas na lógica de fechamento/vencimento de cartão.

## Recommended sequencing

1. Base de dados financeira e lançamentos.
2. Regras de cartão e fluxo mensal.
3. Parcelas/recorrência.
4. Saldo livre e projeção.
5. Investimentos e wishlist.
