# Phase 12: Fundacao de Autenticacao (email/senha) - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Construir a base de autenticacao com cadastro email/senha, login e sessao persistente para habilitar acesso autenticado ao app. Esta fase define contrato de auth e bootstrap inicial de conta, sem cobrir ainda isolamento completo de queries (fase 13) nem polimento final da experiencia de login/cadastro (fase 14).

</domain>

<decisions>
## Implementation Decisions

### Sessao e autenticacao
- Sessao sera transportada em cookie `HttpOnly` com `SameSite` habilitado.
- Estrategia escolhida para fase 12: **JWT stateless** (sem tabela de sessoes no banco neste corte).
- Validade da sessao: 7 dias, com expectativa de renovacao por atividade.
- Cookie `Secure` somente em HTTPS/producao; `HttpOnly` sempre ativo.

### Bootstrap de conta no cadastro
- Cadastro cria automaticamente estrutura `usuario + household` no fluxo inicial (modelo 1:1 no v1.3).
- Baseline inicial obrigatoria: categorias padrao + 1 conta corrente + 1 cartao.
- Nome inicial padrao: `Conta Principal` e `Cartao Principal`, ambos editaveis depois.
- Criacao de usuario + household + baseline deve ocorrer em transacao atomica unica.

### Contrato de erro de autenticacao
- Cadastro com email existente: resposta `409` com mensagem generica (sem revelar existencia de conta).
- Login invalido (email/senha): sempre mensagem unica `Credenciais invalidas`.
- Politica de senha no cadastro: minimo de 6 caracteres (sem regra forte adicional nesta fase).
- Rate limit nao entra agora; deixar pontos de extensao preparados para fase futura.

### Politica de sessao no v1.3
- Multiplas sessoes/dispositivos sao permitidos.
- Logout encerra apenas a sessao atual.
- Como auth e JWT stateless nesta fase, logout e tratado por invalidacao local do token/cookie no cliente (sem revogacao servidor por sessao individual).
- Usuario autenticado acessando `/login` deve ser redirecionado para area principal do app.

### Claude's Discretion
- Definir mecanismo exato de renovacao de 7 dias em JWT (rotacao, refresh implicito ou reemissao controlada).
- Definir claims minimas do token e assinatura (exp, sub, householdId, iat).
- Definir copy final das mensagens de erro mantendo neutralidade e clareza.

</decisions>

<specifics>
## Specific Ideas

- Cadastro permanece simples e focado em teste: email + senha, sem OAuth.
- Seguranca e nao-vazamento de dados sao prioridade absoluta do milestone.
- Fluxo desejado: raiz e login como porta principal, com cadastro em rota isolada.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/server/vite-api.ts`: middleware central com endpoints atuais; ponto natural para inserir endpoints de auth (`/login`, `/n-account`, `/logout`) e validacao de sessao.
- `src/app/foundation/runtime.ts`: camada cliente que hoje envia `householdId`; ponto para migrar para contexto de sessao autenticada.
- `src/main.tsx` + `src/components/layout/app-shell.tsx`: shell principal e roteamento local por tabs; bom ponto para gate de acesso autenticado.
- `src/components/ui/snackbar.tsx`: padrao pronto para feedback de erro de login/cadastro.

### Established Patterns
- Dominio atual usa escopo por `householdId` em services/repositorios; autenticacao deve passar a determinar esse escopo via sessao.
- Backend e frontend estao no mesmo app Vite com API local em middleware.
- Validacoes de entrada seguem Zod em services/controllers.

### Integration Points
- `prisma/schema.prisma`: adicionar modelos de identidade (ex.: `User`) e relacao com household atual.
- `src/server/vite-api.ts`: inserir parser de cookie/JWT e middleware de autenticação para rotas privadas.
- `src/app/foundation/*` pages e `runtime.ts`: remover `household-main` hardcoded e consumir contexto de usuario autenticado.
- Testes `tests/modules/*` e `tests/e2e/*`: adaptar fixture para autenticação e escopo por usuario.

</code_context>

<deferred>
## Deferred Ideas

- Convidar segundo usuario (ex.: marido/esposa) para a mesma household — capability futura, alinhada a governanca multiusuario do roadmap v2 (`SECU-05`).

</deferred>

---

*Phase: 12-fundacao-de-autenticacao-email-senha*
*Context gathered: 2026-03-05*
