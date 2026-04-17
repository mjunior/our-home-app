# Performance Improvement Suggestions

## 1. Lazy-load routes

All pages are eagerly imported in `src/app/routes.tsx`. Switch to `React.lazy` so each page is only loaded when navigated to.

```ts
const CashflowPage = React.lazy(() => import("./foundation/cashflow/page"));
```

Wrap the rendered route in `<Suspense fallback={<Spinner />}>`.

## 2. Split vendor bundle

In `vite.config.ts`, add manual chunks to prevent one large bundle:

```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ["react", "react-dom"],
        ui: ["@radix-ui/react-dialog", "@radix-ui/react-tabs", "lucide-react"],
      },
    },
  },
},
```

## 3. Add DB indexes for common queries

In `prisma/schema.prisma`, add indexes on frequently filtered fields:

```prisma
model Transaction {
  @@index([householdId, date])
  @@index([householdId, settlementStatus])
}
```

## 4. Memoize heavy list components

Transaction and invoice lists re-render on any state change. Wrap stable list items with `React.memo` to avoid unnecessary re-renders.
