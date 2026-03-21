# Our Home App

## Test PR via OpenClaw

open claw edited by jesse

## Test PR via OpenClaw

App web financeiro doméstico com foco em saldo livre mensal e projeção de risco para o próximo mês.

## Requisitos
- Node.js 20+
- npm 10+

## Setup
```bash
npm install
```

## Banco (Prisma)

### Desenvolvimento local (SQLite)
Use `DATABASE_URL` com `file:` (ex.: `.env`):

```env
DATABASE_URL="file:./dev.db"
```

Validar schema local:

```bash
npm run prisma:validate
```

Aplicar schema local:

```bash
npm run db:push
```

### Produção (PostgreSQL)
Em produção, `DATABASE_URL` deve apontar para PostgreSQL:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=disable"
```

Validar schema de produção:

```bash
npm run prisma:validate:prod
```

Aplicar schema de produção:

```bash
npm run db:push:prod
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

## Docker (produção)
Build:

```bash
docker build -t our-home-app:latest .
```

Run:

```bash
docker run --rm -p 4173:4173 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?sslmode=disable" \
  our-home-app:latest
```

O `docker-entrypoint.sh` detecta o tipo da URL e usa:
- `prisma/schema.prod.prisma` para `postgresql://...`
- `prisma/schema.prisma` para `file:...`
