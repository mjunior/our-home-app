# Our Home App

App web financeiro doméstico com foco em saldo livre mensal e projeção de risco para o próximo mês.

## Requisitos
- Node.js 20+
- npm 10+

## Setup
```bash
npm install
```

## Banco (SQLite + Prisma)
`DATABASE_URL` deve apontar para SQLite local (exemplo em `.env`):

```env
DATABASE_URL="file:./dev.db"
```

Validar schema:

```bash
npm run prisma:validate
```

Aplicar schema no banco local:

```bash
npm run db:push
```

## Rodando o app
```bash
npm run dev
```

O front roda em Vite e a API de persistência é servida via middleware local (`/api/*`).

## Testes
```bash
npm test
```

E2E principais:

```bash
npm run test:e2e -- tests/e2e/foundation-flow.spec.ts tests/e2e/cashflow-flow.spec.ts
```

## Build
```bash
npm run build
```
