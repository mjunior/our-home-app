# Milestones

## v1.3 Autenticacao e Isolamento de Conta (Shipped: 2026-03-05)

**Phases completed:** 3 phases, 9 plans

**Key accomplishments:**
- Cadastro e login com email/senha e sessao persistente.
- Isolamento estrito de dados financeiros por `userId` em leitura e escrita.
- Guardas de acesso para bloquear rotas privadas sem autenticacao.
- Login-first na raiz e rota de cadastro isolada.

---

## v1.2 Ui improvements and Import (Shipped: 2026-03-03)

**Phases completed:** 2 phases, 6 plans, 12 tasks

**Key accomplishments:**
- Home do cashflow simplificada (remocao de redundancias visuais e hierarquia mais clara).
- Navegacao mensal estabilizada em desktop/mobile com rotulo de mes curto (`Mar/26`).
- Extrato refinado com data curta `DD/MM`, acao de edicao iconica e melhor legibilidade.
- Fluxo de importacao por textarea integrado ao cashflow com preview de linhas validas/invalidas.
- Parser deterministico para formato `data tipo descricao valor categoria conta recorrente`.
- Persistencia em lote com sucesso parcial (`/api/launches/batch`) e feedback de importadas/rejeitadas.

---

## v1.1 Lancamentos Unificados e Investimento por Transferencia (Shipped: 2026-03-03)

**Phases completed:** 3 phases, 8 plans

**Key accomplishments:**
- Fluxo unificado de novos lancamentos para avulso, recorrencia, parcelamento e investimento.
- Investimento modelado como transferencia interna atomica com edicao/exclusao do par vinculado.
- Cashflow com semantica operacional clara: `Mes atual`, `Proximo mes`, `Gastos mes`.
- Separacao contabil de gastos operacionais x investimentos sem destaque vermelho para investimento.
- Tela de contas com consolidado por tipo e por conta, sem dupla contagem de transferencia interna.

### Known Debt Accepted At Milestone Close
- Rastreabilidade de `requirements-completed` incompleta em alguns `SUMMARY.md` (debt documental, sem gap funcional).

---

## v1.0 MVP Finance Core (Shipped: 2026-03-03)

**Phases completed:** 6 phases, 17 plans

**Key accomplishments:**
- Fundacao financeira completa (contas, cartoes, categorias) com fluxo funcional ponta a ponta.
- Fluxo de caixa mensal com fatura atual/proxima e filtros por conta/cartao/categoria.
- Motor de recorrencias/parcelas com edicao future-only preservando historico fechado.
- Dashboard de saldo livre atual e projetado com explicabilidade e alertas visuais.
- Revamp UI mobile-first premium com Tailwind + shadcn e feedback por snackbar.
- Persistencia real SQLite/Prisma integrada ao runtime principal via API local.

### Known Gaps Accepted At Milestone Close
- CAT-03: Relatorio mensal por categoria (pendente para proximo milestone).
- INV-01, INV-02, INV-03: Investimentos (pendente para proximo milestone).
- WISH-01, WISH-02: Wishlist com impacto (deferido para milestone posterior).
- Hardening estrutural da API (contratos, validacao e modularizacao) identificado como divida tecnica.

---
