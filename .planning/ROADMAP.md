# Roadmap: Nosso Lar Financeiro

## Milestones

- ✅ **v1.0 MVP Finance Core** — Phases 1-4.2 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.0-ROADMAP.md`
- ✅ **v1.1 Lancamentos Unificados e Investimento por Transferencia** — Phases 7-9 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.1-ROADMAP.md`
- ✅ **v1.2 Ui improvements and Import** — Phases 10-11 (shipped 2026-03-03) — detalhes: `.planning/milestones/v1.2-ROADMAP.md`
- ◆ **v1.3 Autenticacao e Isolamento de Conta** — Phases 12-14 (in progress)

## Phases

- [x] **Phase 12: Fundacao de Autenticacao (email/senha)** - Introduzir modelo de usuario, credenciais seguras e sessao autenticada para login. (completed 2026-03-05)
- [x] **Phase 13: Isolamento de Dados e Guardas de Acesso** - Aplicar escopo obrigatorio por `userId` no backend e bloquear rotas privadas para anonimos. (completed 2026-03-05)
- [x] **Phase 14: UX de Login e Cadastro Isolado** - Entregar pagina de login premium non-index na raiz e rota `/n-account` sem navegacao publica. (completed 2026-03-05)

## Phase Details

### Phase 12: Fundacao de Autenticacao (email/senha)

**Goal**: Criar base tecnica de autenticacao com cadastro email/senha e sessao persistente.  
**Depends on**: Phase 11  
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04  
**Plans**: 3 plans

Success criteria:
1. Usuario consegue criar conta com email e senha validos sem duplicidade de email.
2. Login com credenciais corretas cria sessao reutilizavel apos refresh.
3. Senha e armazenada em hash forte e nunca retorna em respostas de API.
4. Erros de login/cadastro sao padronizados sem revelar informacoes sensiveis.

### Phase 13: Isolamento de Dados e Guardas de Acesso

**Goal**: Garantir segregacao total entre contas e controle de acesso em todas as rotas privadas.  
**Depends on**: Phase 12  
**Requirements**: SECU-01, SECU-02, SECU-03, SECU-04  
**Plans**: 3 plans

Success criteria:
1. Rotas privadas retornam `401` quando nao autenticado.
2. Todas as operacoes financeiras leem e escrevem apenas dados do `userId` da sessao.
3. Tentativas de acesso a dados de outra conta falham com `403/404` sem vazamento.
4. Testes cobrem casos positivos e negativos de isolamento multi-conta.

### Phase 14: UX de Login e Cadastro Isolado

**Goal**: Ajustar navegacao e apresentacao para fluxo de entrada seguro e alinhado ao contexto familiar.  
**Depends on**: Phase 13  
**Requirements**: UX-01, UX-02, UX-03, UX-04  
**Plans**: 3 plans
**Gap Closure**: Fecha os gaps da auditoria `v1.3-MILESTONE-AUDIT.md` (requirements + integration + flows).

Success criteria:
1. `/` abre login como landing principal com visual polido e identidade de controle familiar.
2. Metadados de `/` e `/login` configurados com noindex.
3. Rota `/n-account` funciona para criacao de conta, mas nao aparece em links da UI.
4. Usuario autenticado e redirecionado para area principal sem acessar telas anonimas.

## Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.0 MVP Finance Core | 1-4.2 | 17/17 | Complete | 2026-03-03 |
| v1.1 Lancamentos Unificados e Investimento por Transferencia | 7-9 | 8/8 | Complete | 2026-03-03 |
| v1.2 Ui improvements and Import | 10-11 | 6/6 | Complete | 2026-03-03 |
| v1.3 Autenticacao e Isolamento de Conta | 12-14 | 9/9 | Complete | 2026-03-05 |
