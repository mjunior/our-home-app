# Pitfalls Research — Home Finance

## Pitfall 1: Misturar saldo contábil com saldo disponível
- Warning signs: valores não batem entre tela de conta e dashboard.
- Prevention: definir claramente saldo atual, saldo projetado e saldo livre.
- Suggested phase: fase de modelagem e cálculo de saldo livre.

## Pitfall 2: Parcelas duplicadas ou faltantes
- Warning signs: fatura cresce sem explicação ou parcelas somem.
- Prevention: cronograma determinístico por compra parcelada com idempotência.
- Suggested phase: fase de parcelamento/recorrência.

## Pitfall 3: Projeção sem considerar fechamento/vencimento de cartão
- Warning signs: saldo livre otimista demais.
- Prevention: separar data da compra, data de fechamento e data de pagamento.
- Suggested phase: fase de fluxo de caixa/cartões.

## Pitfall 4: Categorias inconsistentes
- Warning signs: relatórios inúteis por excesso de categorias duplicadas.
- Prevention: normalização de categorias e validação de naming.
- Suggested phase: fase de transações/categorias.
