# Phase 7: Fluxo Unico de Lancamentos - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Unificar o fluxo de criacao de lancamentos (avulso, recorrencia e parcelamento) em uma experiencia unica, mantendo regras consistentes de dominio, preservando historico fechado e exibindo origem das movimentacoes no extrato/projecao.

</domain>

<decisions>
## Implementation Decisions

### Entrada e distribuicao do fluxo
- O ponto principal de criacao sera `Cashflow > Novo lancamento`.
- O fluxo unificado deve ser priorizado para uso diario no Cashflow.
- A tela dedicada de `Parcelas e Recorrencias` pode ser removida como area de criacao.
- O app deve manter CTA fixo no mobile e adicionar acao destacada equivalente no desktop para abrir o fluxo unificado.

### Contrato do formulario unificado
- O formulario usara seletor no topo em tabs: `Avulso | Recorrencia | Parcelamento`.
- Campos base compartilhados: data, descricao, valor, destino e tipo; categoria deve ser opcional.
- Recorrencia: data/mes inicial sem data fim obrigatoria, gerando janela padrao de 12 meses.
- Parcelamento: entrada por valor total + quantidade de parcelas; o sistema divide automaticamente os valores.

### Regras de edicao future-only
- Recorrencia deve permitir editar somente a partir de um mes efetivo em diante, com confirmacao explicita para aplicar nas proximas ocorrencias.
- Parcelamento pode permitir alteracoes livres nas ocorrencias futuras.
- Encerramento de recorrencia deve remover o mes atual selecionado e os seguintes, preservando historico anterior.
- Sempre que houver revisao/substituicao de regra, manter vinculo rastreavel entre origem e revisao quando possivel.

### Origem no extrato e projecao
- Extrato deve mostrar origem da linha com identificacao explicita por grupo: `Avulso`, `Recorrente`, `Parcela`.
- Parcelas devem expor sequencia (`n/N`) para leitura rapida.
- Projecao/saldo livre deve agrupar separadamente: recorrentes, parcelas e gastos extras (avulsos).
- Cashflow deve oferecer filtro por origem para leitura do mesmo conjunto unificado.

### Claude's Discretion
- Escolher a variante visual final da identificacao de origem (badge/coluna/icone), mantendo clareza e consistencia com o design atual.
- Definir copy final dos textos de confirmacao de edicao future-only para reduzir erro de operacao.
- Definir comportamento de fallback quando nao for possivel recuperar vinculo historico completo de revisao.

</decisions>

<specifics>
## Specific Ideas

- Fluxo principal desejado: "Novo lancamento" no Cashflow como centro operacional diario.
- Categoria deve poder ficar opcional no formulario unificado.
- Recorrencia sem fim explicito no cadastro inicial; horizonte de geracao padrao em 12 meses.
- Parcelamento deve partir de valor total da compra + quantidade de parcelas, com rateio automatico.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/foundation/transaction-form.tsx`: formulario ja integrado ao CTA de Novo lancamento no Cashflow.
- `src/components/foundation/recurrence-form.tsx` e `src/components/foundation/installment-form.tsx`: campos especificos que podem ser fundidos em secoes condicionais por tipo.
- `src/components/foundation/statement-table.tsx`: ponto natural para exibir origem (`Avulso/Recorrente/Parcela`) e sequencia de parcela.
- `src/components/ui/sheet.tsx` + `src/components/ui/button.tsx`: base para manter CTA fixo mobile e acao destacada desktop sem criar novo padrao visual.

### Established Patterns
- Validacoes de dominio ja usam Zod em services (`transactions`, `recurrence`, `installments`).
- Regra de integridade atual exige alvo unico (`accountId` xor `creditCardId`) para saidas.
- Gestao de recorrencia ja opera com lock do passado e remocao de futuras instancias na revisao.

### Integration Points
- `src/app/foundation/cashflow/page.tsx`: concentrar abertura do fluxo unificado e filtros por origem no extrato.
- `src/app/foundation/schedules/page.tsx`: migrar papel para visao/gerenciamento ou absorver no Cashflow conforme execucao da fase.
- `src/modules/scheduling/schedule-management.service.ts`: reaproveitar estrategia de future-only para o novo contrato unificado.
- `src/modules/transactions/*` e `src/modules/scheduling/*`: alinhar metadados de origem para suportar LAN-04 no extrato e na projecao.

</code_context>

<deferred>
## Deferred Ideas

- Navegacao completa entre meses no Cashflow para analise historica ampla (pode demandar fase dedicada se extrapolar o objetivo da Phase 7).

</deferred>

---
*Phase: 07-fluxo-unico-de-lancamentos*
*Context gathered: 2026-03-03*
