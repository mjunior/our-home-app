# Phase 11: Importacao de Lancamentos por Texto - Research

**Researched:** 2026-03-03
**Domain:** Importacao manual em lote por textarea (parser por linha, preview de validacao e persistencia parcial)
**Confidence:** HIGH

## User Constraints

Constraints locked from milestone discussion and `REQUIREMENTS.md`:
- Fluxo nasce dentro da tela de cashflow.
- Entrada e por textarea com varias linhas, uma transacao por linha.
- Formato alvo: `data tipo descricao valor categoria conta recorrente`.
- Exemplo-base: `01/02 saida compra_bahamas 50.00 mercado c6 recorrente`.
- Erros devem ser exibidos por linha sem descartar linhas validas.
- Confirmacao final deve criar todos os lancamentos validos de uma vez.
- Campo `recorrente` deve aceitar variacoes equivalentes de sim/nao.

Deferred/out-of-scope:
- Open Finance e integracao bancaria automatica.
- Categorizacao automatica por IA.
- Editor em massa pos-importacao.

## Summary

O codigo atual ja possui um fluxo unificado de criacao (`ScheduleManagementService.createUnifiedLaunch`) com suporte a `ONE_OFF`, `RECURRING`, `INSTALLMENT` e `INVESTMENT`, alem da UI `UnifiedLaunchForm` para criacao manual. Para a fase 11, a menor rota de risco e adicionar um importador textual com parser deterministico no frontend, preview de validacao, e confirmacao em lote por meio de um novo metodo de batch no scheduling controller/service.

A estrategia recomendada:
1. Criar parser puro e testavel para converter linha textual em modelo intermediario.
2. Renderizar preview no formulario de importacao (validas vs invalidas + erros por linha).
3. No submit final, enviar apenas validas para criacao em lote e retornar resumo agregado.
4. Recarregar extrato apos importacao para refletir resultado imediatamente no cashflow.

## Existing Architecture Signals

- `src/app/foundation/cashflow/page.tsx` concentra orquestracao da tela e ja controla abertura de sheet/modal de novo lancamento.
- `src/modules/scheduling/schedule-management.service.ts` e ponto correto para expandir criacao em lote.
- `src/modules/scheduling/schedule-management.controller.ts` expone contratos de criacao para camada de UI.
- `tests/modules/schedule-management.test.ts` e arquivo de referencia atual para cobertura de scheduling (nao existe `schedule-management.service.test.ts`).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x (project) | UI de importacao e preview | Ja e base da app |
| TypeScript | 5.x | Parser tipado + payload batch | Evita ambiguidade de mapeamento |
| Zod | 3.x | Validacao de contratos de batch no service | Padrao atual no modulo scheduling |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 2.x | Testes unitarios do parser e service batch | Cobrir casos de formato e erro por linha |
| Playwright (e2e existente) | current | Garantir fluxo ponta a ponta no cashflow | Abrir importador, validar preview, confirmar importacao |

**Installation:**
```bash
# Nenhuma dependencia nova necessaria para a fase 11
```

## Architecture Patterns

### Pattern 1: Parser puro com resultado discriminado
**What:** cada linha gera `valid` com payload normalizado ou `invalid` com motivo e numero da linha.
**Why:** permite feedback granular sem interromper lote.

### Pattern 2: Preview-first UX
**What:** textarea -> processar -> resumo (`N validas`, `M invalidas`) -> lista de erros -> confirmar.
**Why:** reduz importacoes erradas e explica o que sera persistido.

### Pattern 3: Persistencia parcial com relatorio agregado
**What:** batch processa item a item e retorna totais (`importadas`, `falhas`) + detalhe de falhas.
**Why:** cumpre IMP-03/IMP-04 sem bloquear todo lote por uma linha ruim.

## Parsing Contract Recommendation

Formato por linha (tokens separados por espaco):
`DD/MM tipo descricao valor categoria conta recorrente`

Mapeamento recomendado:
- `data`: `DD/MM` -> resolve ano usando mes em foco no cashflow (fallback ano atual da sessao)
- `tipo`: `entrada|saida` (alias: `in|out`, `income|expense`)
- `descricao`: token unico sem espaco (conforme requisito atual)
- `valor`: decimal com ponto (`50.00`) ou virgula (`50,00`) normalizado para string monetaria interna
- `categoria`: token chave de categoria (resolver por nome normalizado)
- `conta`: token chave de conta/cartao (resolver por nome normalizado)
- `recorrente`: `recorrente|sim|true|1|nao|false|0`

Regra de negocio sugerida:
- `recorrente=true` -> criar `RECURRING` com `startMonth` derivado da data
- `recorrente=false` -> criar `ONE_OFF` com `occurredAt` completo

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Parsing ad-hoc em JSX | Split/if inline no componente | Parser dedicado em `src/modules/transactions/` | Facilita testes e manutencao |
| Validacao de payload manual | ifs espalhados no controller | Schemas Zod no service | Consistencia com stack atual |
| Batch transacional total | Falhar lote inteiro no 1o erro | Persistencia parcial + relatorio por item | Aderente ao requisito de preservar validas |

## Common Pitfalls

### Pitfall 1: Ambiguidade de ano em `DD/MM`
- **Risk:** importar `31/12` em janela de janeiro pode cair no ano errado.
- **Avoid:** resolver ano com base no mes selecionado na tela e explicitar regra na UI.

### Pitfall 2: Dependencia de labels nao normalizados
- **Risk:** categoria/conta digitada com variacao de caixa/acento falha sem feedback claro.
- **Avoid:** normalizar (`lowercase`, remover acentos) no lookup e retornar sugestao no erro.

### Pitfall 3: Misturar parser e persistencia no mesmo passo
- **Risk:** UX ruim (sem preview) e depuracao dificil.
- **Avoid:** separar claramente `processar` (preview) de `confirmar` (persistencia).

### Pitfall 4: Cobertura de teste em arquivo errado
- **Risk:** plano aponta para arquivo inexistente e gera friccao no execute-phase.
- **Avoid:** reutilizar `tests/modules/schedule-management.test.ts` ou criar novo arquivo explicitamente.

## Open Questions

1. Regra final do ano para `DD/MM`: usar sempre o ano do mes selecionado no cashflow?
2. Campo `conta`: deve aceitar conta e cartao no mesmo token (com resolucao por prioridade)?
3. Para `recorrente=true`, a data `DD/MM` deve impactar apenas mes inicial ou tambem dia de recorrencia futura?

---
*Phase: 11-importacao-de-lancamentos-por-texto*
*Research generated: 2026-03-03*
