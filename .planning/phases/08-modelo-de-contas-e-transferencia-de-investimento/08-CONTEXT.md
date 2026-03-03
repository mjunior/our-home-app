# Phase 8: Modelo de Contas e Transferencia de Investimento - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementar o modelo de contas tipadas para o ciclo v1.1 e registrar investimento como transferencia contabil rastreavel (debito em origem + credito em destino) dentro do fluxo unificado de novo lancamento, preservando rastreabilidade e operacao pelo Cashflow.

</domain>

<decisions>
## Implementation Decisions

### Tipos de conta ativos e visibilidade
- O produto passa a operar com dois tipos de conta: `CONTA_CORRENTE` e `CONTA_INVESTIMENTO`.
- Tipos legados anteriores podem ser descartados/resetados neste ciclo (sem necessidade de migracao de producao).
- `CONTA_INVESTIMENTO` fica fora da visao consolidada principal do Cashflow; consulta detalhada de investimento acontece no submenu/tela de contas.
- `CONTA_INVESTIMENTO` pode ter saida manual (ex.: saque) em lancamento comum.

### Investimento no fluxo de novo lancamento
- Investimento entra como aba propria no formulario unificado de `Novo lancamento`.
- Nesta fase, investimento sera apenas avulso (sem recorrencia/parcelamento para investimento).
- Campos de investimento: `data`, `descricao`, `valor`, `conta origem`, `conta destino` e `categoria` opcional.
- Investimento nao expoe seletor `entrada/saida`; o contrato e sempre transferencia interna atomica.

### Regras de origem e destino da transferencia
- Para investimento da fase 8, a transferencia sera de `CONTA_CORRENTE` (origem) para `CONTA_INVESTIMENTO` (destino).
- Cartao de credito nao participa de investimento como origem nem destino.
- Transferencias entre contas de investimento (`investimento -> investimento`) ficam fora desta fase.

### Edicao, exclusao e rastreabilidade no Cashflow
- Edicao de investimento no Cashflow deve sempre atualizar as duas pernas vinculadas (debito + credito).
- Exclusao de investimento no Cashflow deve sempre remover as duas pernas vinculadas.
- Como investimento e avulso na fase 8, exclusao e sobre a ocorrencia atual (sem escopo de serie).
- Extrato deve manter vinculo explicito entre as duas movimentacoes do mesmo investimento para auditoria/reconciliacao.

### Claude's Discretion
- Definir o formato visual exato do vinculo de transferencia no extrato (badge, id curto, label ou icone), mantendo legibilidade mobile.
- Definir copy final de mensagens de confirmacao para edicao/exclusao atomica.

</decisions>

<specifics>
## Specific Ideas

- Diretriz do usuario: investimento e saida de um lugar e entrada em outro, com rastreio de vinculo quando possivel.
- Diretriz do usuario: recorrencias/parcelamentos seguem no mesmo fluxo unificado do Cashflow, e investimento entra nesse mesmo ponto de entrada.
- Diretriz do usuario: conta investimento deve ficar menos exposta na leitura principal de cashflow (foco operacional continua no fluxo do dia a dia).

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/foundation/unified-launch-form.tsx`: base natural para adicionar aba `Investimento` no mesmo contrato visual do novo lancamento.
- `src/app/foundation/cashflow/page.tsx`: ponto principal para criacao, edicao e exclusao em contexto do extrato mensal.
- `src/components/foundation/statement-table.tsx`: local de exibicao do vinculo entre debito e credito de investimento.
- `src/components/foundation/account-form.tsx` e `src/app/foundation/accounts/page.tsx`: pontos para ajustar tipos permitidos e UX de contas tipadas.

### Established Patterns
- Validacoes de dominio usam Zod nos services/controllers.
- Mutacoes de recorrencia/parcelamento em fase 7 ja adotam regra de edicao/exclusao via escopo e preservacao de historico; padrao pode ser reutilizado para operacoes atomicas de investimento avulso.
- Runtime/API centralizados em `src/app/foundation/runtime.ts` e `src/server/vite-api.ts`.

### Integration Points
- Dominio de contas: `src/domain/accounts/account.entity.ts` e `src/modules/accounts/*` para tipagem `CHECKING/INVESTMENT`.
- Dominio transacional: `src/modules/transactions/*` e possivel extensao em `src/modules/scheduling/schedule-management.service.ts` para criar evento atomico de investimento.
- Persistencia: `prisma/schema.prisma` e endpoints em `src/server/vite-api.ts` para suportar dupla movimentacao com chave de vinculo.
- Calculo de saldo livre: `src/modules/free-balance/free-balance.service.ts` deve preservar semantica contabil sem tratar investimento como gasto operacional do cashflow principal.

</code_context>

<deferred>
## Deferred Ideas

- Suporte a investimento recorrente ou parcelado.
- Transferencias entre contas de investimento.
- Exibicao consolidada avancada de patrimonio de investimento fora da tela de contas.

</deferred>

---
*Phase: 08-modelo-de-contas-e-transferencia-de-investimento*
*Context gathered: 2026-03-03*
