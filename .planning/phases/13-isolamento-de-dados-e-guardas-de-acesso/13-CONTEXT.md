# Phase 13: Isolamento de Dados e Guardas de Acesso - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Aplicar isolamento estrito por sessao autenticada em todas as rotas privadas e operacoes financeiras, removendo dependencias de `householdId` vindo do cliente e bloqueando acesso anonimo fora de `/login` e `/n-account`.

</domain>

<decisions>
## Implementation Decisions

### Fonte unica de escopo
- Em todas as rotas privadas, o backend deve ignorar completamente `householdId` enviado por query/body.
- Contratos privados devem remover `householdId` do payload/query na fase 13.
- Requests sem sessao valida falham no middleware global com `401`.
- Remover totalmente qualquer fallback para `household-main` em endpoints privados.

### Politica de autorizacao e erros
- Nao autenticado retorna `401` com codigo/mensagem `AUTH_UNAUTHENTICATED`.
- Acesso a recurso de outro usuario deve retornar `404` para nao revelar existencia.
- Mensagens de acesso negado devem ser neutras e consistentes.
- Frontend ao receber `401` deve limpar sessao local e redirecionar para `/login`.

### Rollout de guardas
- Aplicar guardas em modo big-bang (todas as rotas privadas na fase 13).
- Atualizar runtime/pages para remover envio de `householdId` ja nesta fase.
- Se quebrar algo, seguir fail-closed (nao abrir excecao temporaria de seguranca).
- Cobertura de testes obrigatoria por modulo + e2e de auth/acesso.

### Dados legados
- Executar script de migracao para associar dados existentes ao household do usuario dono.
- Dados ambiguos/orfaos devem ser apagados (decisao explicita do usuario).
- Rodar migracao no deploy da fase 13.
- Em dev/local: reset e seed limpo por usuario.

### Claude's Discretion
- Definir desenho exato do middleware de auth/tenant no `vite-api.ts` (helper unico vs wrappers por rota).
- Definir estrategia detalhada de migracao (script Prisma/SQL) mantendo auditabilidade minima.
- Definir granularidade dos testes de regressao por endpoint.

</decisions>

<specifics>
## Specific Ideas

- Seguranca primeiro: melhor quebrar fluxo do que permitir bypass de escopo.
- Nao manter compatibilidade com `householdId` legado no contrato privado.
- Resposta `404` para acesso cruzado e parte da estrategia anti-enumeracao.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/vite-api.ts`: middleware central de todas as rotas; ponto principal para enforce de sessao + escopo por claim.
- `src/modules/auth/session-token.ts` + `AuthService`: base pronta para extrair contexto autenticado.
- `src/app/foundation/runtime.ts`: ja possui sessao ativa em memoria; precisa remover dependencia de `householdId` em chamadas privadas.

### Established Patterns
- Services/repositorios ainda recebem `householdId` explicitamente e validam ownership no dominio.
- Varias rotas API ainda leem `householdId` por query/body com fallback `household-main`.
- Pages foundation ainda usam constante `HOUSEHOLD_ID = "household-main"`.

### Integration Points
- Backend: criar guarda global para rotas privadas e helper unico para resolver `householdId` da sessao.
- Runtime/frontend: remover `HOUSEHOLD_ID` hardcoded de pages e chamadas API privadas.
- Testes: atualizar suites que usam `household-main` fixo para contexto por sessao/usuario.
- Dados: adicionar migracao e rotina de reset+seed para ambiente local.

</code_context>

<deferred>
## Deferred Ideas

- Controle de papeis (RBAC) continua fora do escopo da fase 13.
- Convite multiusuario (SECU-05) continua para fase futura.

</deferred>

---

*Phase: 13-isolamento-de-dados-e-guardas-de-acesso*
*Context gathered: 2026-03-05*
