# Architecture Research — Home Finance

## Main Components

- Ledger Service: transações, categorias, lançamentos manuais.
- Accounts & Cards Service: contas, cartões, ciclos de fatura.
- Scheduling Engine: recorrências e parcelamentos futuros.
- Free Balance Engine: cálculo do saldo livre atual e projetado.
- Investments Module: posição, aportes, rendimentos, resgates.
- Wishlist Module: itens desejados e impacto no saldo livre.

## Data Flow

1. Usuário registra movimentação (conta/cartão).
2. Scheduling Engine materializa eventos futuros (parcelas/recorrências).
3. Free Balance Engine consolida saldos e obrigações.
4. Dashboard apresenta saldo livre com explicação por origem.

## Build Order

1. Modelo financeiro base (contas, cartões, categorias, transações).
2. Regras de fatura e fluxo de caixa mensal.
3. Parcelamento/recorrência.
4. Motor de saldo livre.
5. Investimentos e wishlist.
