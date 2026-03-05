# Requirements: Nosso Lar Financeiro

**Defined:** 2026-03-05
**Core Value:** Mostrar com clareza o saldo livre do mes atual e do proximo mes para evitar ficar no negativo.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Usuario pode criar conta com email e senha na rota `/n-account`.
- [ ] **AUTH-02**: Usuario pode autenticar com email e senha validos.
- [ ] **AUTH-03**: Sessao autenticada persiste entre refresh e reinicio da aba.
- [ ] **AUTH-04**: Credenciais invalidas retornam erro claro sem expor detalhes sensiveis.

### Access Control and Data Isolation

- [ ] **SECU-01**: Toda rota da aplicacao, exceto `/login` e `/n-account`, exige autenticacao.
- [ ] **SECU-02**: Usuario autenticado so consegue consultar transacoes, contas, cartoes e categorias do proprio `userId`.
- [ ] **SECU-03**: Usuario autenticado so consegue criar/editar/excluir dados financeiros vinculados ao proprio `userId`.
- [ ] **SECU-04**: Tentativas de acesso cruzado entre contas retornam erro de autorizacao sem vazar existencia de dados.

### Login Experience

- [ ] **UX-01**: Rota raiz `/` exibe pagina de login como entrada principal do produto.
- [ ] **UX-02**: Pagina `/login` e a unica rota nao autenticada com link de navegacao visivel para usuarios finais.
- [ ] **UX-03**: Paginas `/` e `/login` usam `noindex` para nao indexacao em buscadores.
- [ ] **UX-04**: Nao existe link publico entre `/login` e `/n-account` no frontend.

## v2 Requirements

### Account Management

- **AUTH-05**: Usuario pode recuperar senha por email com token de expiracao.
- **AUTH-06**: Usuario pode alterar senha dentro da area autenticada.

### Governance

- **SECU-05**: Usuario pode convidar outro membro da familia com permissao limitada.
- **SECU-06**: Sistema registra trilha de auditoria para acessos e mudancas criticas.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Login social (Google/Apple) | Aumenta complexidade de integracao sem necessidade imediata |
| Cadastro publico descobrivel em navegacao principal | Requisito atual pede rota isolada para testes controlados |
| Controle de papeis (admin/colaborador/leitor) | Primeiro corte exige apenas isolamento por conta |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 12 | Pending |
| AUTH-02 | Phase 12 | Pending |
| AUTH-03 | Phase 12 | Pending |
| AUTH-04 | Phase 12 | Pending |
| SECU-01 | Phase 13 | Pending |
| SECU-02 | Phase 13 | Pending |
| SECU-03 | Phase 13 | Pending |
| SECU-04 | Phase 13 | Pending |
| UX-01 | Phase 14 | Pending |
| UX-02 | Phase 14 | Pending |
| UX-03 | Phase 14 | Pending |
| UX-04 | Phase 14 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-05*
*Last updated: 2026-03-05 after milestone v1.3 roadmap creation*
