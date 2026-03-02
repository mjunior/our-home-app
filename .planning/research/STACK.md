# Stack Research — Home Finance Web App

## Recommended Baseline

- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript (NestJS or Fastify)
- Database: PostgreSQL
- ORM: Prisma
- Auth: Better Auth or Auth.js (email/password)
- Background jobs: BullMQ + Redis (recorrencias, parcelas, fechamentos)
- Charts/UI: Recharts + component library (Radix + Tailwind)
- Infra: Docker Compose (dev), managed Postgres + object storage (prod)

## Why this stack

- Strong ecosystem for dashboards financeiros.
- Tipagem ponta a ponta para reduzir erros de cálculo.
- PostgreSQL facilita consistência em transações e projeções mensais.
- Jobs assíncronos cobrem geração automática de recorrências e parcelas.

## What to avoid in v1

- Microservices: overhead desnecessário no início.
- Multi-database architecture: aumenta risco de divergência de saldo.
- Event sourcing completo no MVP: alto custo de implementação.

## Confidence

- Arquitetura monolítica com Postgres: alta
- Jobs para automações financeiras: alta
- Escolha exata de framework backend (Nest vs Fastify): média
