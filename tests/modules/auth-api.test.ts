import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  users: [] as Array<{ id: string; email: string; passwordHash: string; householdId: string }>,
  accounts: [] as Array<{ id: string; householdId: string; name: string; type: "CHECKING"; openingBalance: ReturnType<typeof decimal>; goalAmount?: null }>,
  cards: [] as Array<{ id: string; householdId: string; name: string; closeDay: number; dueDay: number }>,
  categories: [] as Array<{ id: string; householdId: string; name: string; normalized: string }>,
  transactions: [] as Array<any>,
  householdCount: 0,
};

function decimal(value: string) {
  return { toString: () => value };
}

function date(value: string) {
  return new Date(value);
}

vi.mock("../../src/modules/shared/persistence/prisma", () => {
  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: any) => {
        if (where.email) {
          return state.users.find((item) => item.email === where.email) ?? null;
        }
        if (where.id) {
          return state.users.find((item) => item.id === where.id) ?? null;
        }
        return null;
      }),
    },
    household: {
      create: vi.fn(async () => ({ id: `home-${++state.householdCount}` })),
    },
    account: {
      create: vi.fn(async ({ data }: any) => {
        const created = {
          id: `acc-${state.accounts.length + 1}`,
          ...data,
          openingBalance: decimal(String(data.openingBalance)),
          goalAmount: null,
        };
        state.accounts.push(created);
        return created;
      }),
      findMany: vi.fn(async ({ where }: any = {}) => state.accounts.filter((item) => !where?.householdId || item.householdId === where.householdId)),
      findUnique: vi.fn(async ({ where }: any) => state.accounts.find((item) => item.id === where.id) ?? null),
    },
    creditCard: {
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `card-${state.cards.length + 1}`, ...data };
        state.cards.push(created);
        return created;
      }),
      findMany: vi.fn(async () => state.cards),
      findUnique: vi.fn(async ({ where }: any) => state.cards.find((item) => item.id === where.id) ?? null),
    },
    category: {
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `cat-${state.categories.length + 1}`, ...data };
        state.categories.push(created);
        return created;
      }),
      findMany: vi.fn(async () => state.categories),
      findFirst: vi.fn(async ({ where }: any) =>
        state.categories.find((item) => item.householdId === where.householdId && item.normalized === where.normalized) ?? null,
      ),
      upsert: vi.fn(async ({ where, create }: any) => {
        const existing = state.categories.find(
          (item) =>
            item.householdId === where.householdId_normalized.householdId &&
            item.normalized === where.householdId_normalized.normalized,
        );
        if (existing) return existing;
        const created = { id: `cat-${state.categories.length + 1}`, ...create };
        state.categories.push(created);
        return created;
      }),
    },
    transaction: {
      findMany: vi.fn(async ({ where }: any = {}) =>
        state.transactions.filter((item) => {
          if (where?.householdId && item.householdId !== where.householdId) return false;
          if (where?.creditCardId && item.creditCardId !== where.creditCardId) return false;
          return true;
        }),
      ),
      create: vi.fn(async ({ data }: any) => {
        const created = {
          id: `tx-${state.transactions.length + 1}`,
          ...data,
          amount: decimal(String(data.amount)),
          occurredAt: data.occurredAt instanceof Date ? data.occurredAt : date(data.occurredAt),
          invoiceDueDate: data.invoiceDueDate instanceof Date || data.invoiceDueDate === null ? data.invoiceDueDate : date(data.invoiceDueDate),
          createdAt: date("2026-04-15T12:00:00.000Z"),
        };
        state.transactions.push(created);
        return created;
      }),
    },
    scheduledInstance: { findMany: vi.fn(async () => []) },
    installmentPlan: { findMany: vi.fn(async () => []) },
    recurringRule: { findMany: vi.fn(async () => []) },
    invoiceSettlement: { findMany: vi.fn(async () => []) },
    $transaction: vi.fn(async (callback: any) => {
      const tx = {
        household: prisma.household,
        account: prisma.account,
        creditCard: prisma.creditCard,
        category: prisma.category,
        user: {
          create: vi.fn(async ({ data }: any) => {
            const created = { id: `user-${state.users.length + 1}`, ...data };
            state.users.push(created);
            return created;
          }),
        },
      };
      return callback(tx);
    }),
  };

  return { prisma };
});

import { installViteApi } from "../../src/server/vite-api";

type Handler = (req: any, res: any, next: () => void) => void | Promise<void>;

let handler: Handler | null = null;

installViteApi({
  middlewares: {
    use(nextHandler) {
      handler = nextHandler;
    },
  },
});

async function request(input: { method: string; url: string; body?: unknown; cookie?: string }) {
  const req = Readable.from(input.body ? [Buffer.from(JSON.stringify(input.body), "utf8")] : []);
  (req as any).method = input.method;
  (req as any).url = input.url;
  (req as any).headers = input.cookie ? { cookie: input.cookie } : {};

  const headers = new Map<string, string | string[]>();
  let payload = "";

  const res: any = {
    statusCode: 200,
    setHeader(key: string, value: string | string[]) {
      headers.set(key, value);
    },
    end(value: string) {
      payload = value;
    },
  };

  await handler?.(req, res, () => undefined);

  return {
    status: res.statusCode,
    body: payload ? JSON.parse(payload) : {},
    headers,
  };
}

describe("auth api", () => {
  beforeEach(() => {
    state.users.length = 0;
    state.accounts.length = 0;
    state.cards.length = 0;
    state.categories.length = 0;
    state.transactions.length = 0;
    state.householdCount = 0;
  });

  it("registers and issues session cookie", async () => {
    const result = await request({
      method: "POST",
      url: "/api/auth/register",
      body: { email: "owner@home.app", password: "secret12" },
    });

    expect(result.status).toBe(200);
    expect(result.body.user.email).toBe("owner@home.app");
    expect(String(result.headers.get("Set-Cookie"))).toContain("ourhome_session=");
  });

  it("returns generic invalid credentials on bad password", async () => {
    await request({
      method: "POST",
      url: "/api/auth/register",
      body: { email: "owner@home.app", password: "secret12" },
    });

    const result = await request({
      method: "POST",
      url: "/api/auth/login",
      body: { email: "owner@home.app", password: "wrong" },
    });

    expect(result.status).toBe(401);
    expect(result.body.message).toBe("Credenciais invalidas");
  });

  it("loads session via /api/auth/me and clears on logout", async () => {
    const registered = await request({
      method: "POST",
      url: "/api/auth/register",
      body: { email: "owner@home.app", password: "secret12" },
    });

    const cookie = String(registered.headers.get("Set-Cookie")).split(";")[0];

    const me = await request({ method: "GET", url: "/api/auth/me", cookie });
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe("owner@home.app");

    const logout = await request({ method: "POST", url: "/api/auth/logout", cookie });
    expect(logout.status).toBe(200);
    expect(String(logout.headers.get("Set-Cookie"))).toContain("Max-Age=0");
  });

  it("blocks private route without session and allows with session", async () => {
    const blocked = await request({ method: "GET", url: "/api/accounts" });
    expect(blocked.status).toBe(401);
    expect(blocked.body.message).toBe("AUTH_UNAUTHENTICATED");

    const registered = await request({
      method: "POST",
      url: "/api/auth/register",
      body: { email: "owner@home.app", password: "secret12" },
    });
    const cookie = String(registered.headers.get("Set-Cookie")).split(";")[0];

    const allowed = await request({ method: "GET", url: "/api/accounts", cookie });
    expect(allowed.status).toBe(200);
    expect(Array.isArray(allowed.body)).toBe(true);
  });

  it("creates invoice adjustment with authenticated household and ignores household from body", async () => {
    const registered = await request({
      method: "POST",
      url: "/api/auth/register",
      body: { email: "owner@home.app", password: "secret12" },
    });
    const cookie = String(registered.headers.get("Set-Cookie")).split(";")[0];
    const card = state.cards[0]!;
    const category = state.categories[0]!;
    state.transactions.push({
      id: "tx-base",
      householdId: registered.body.user.householdId,
      kind: "EXPENSE",
      description: "Compra base",
      amount: decimal("100.00"),
      occurredAt: date("2026-03-01T12:00:00.000Z"),
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-03",
      invoiceDueDate: date("2026-03-12T00:00:00.000Z"),
      settlementStatus: null,
      transferGroupId: null,
      createdAt: date("2026-03-01T12:00:00.000Z"),
    });

    const result = await request({
      method: "POST",
      url: "/api/invoices/adjustment",
      cookie,
      body: {
        householdId: "attacker-household",
        cardId: card.id,
        realInvoiceTotal: "140.00",
        dueMonth: "2026-03",
        occurredAt: "2026-03-15T12:00:00.000Z",
      },
    });

    expect(result.status).toBe(200);
    expect(result.body.previousInvoiceTotal).toBe("100.00");
    expect(result.body.realInvoiceTotal).toBe("140.00");
    expect(result.body.difference).toBe("40.00");
    expect(result.body.transaction).toMatchObject({
      householdId: registered.body.user.householdId,
      kind: "EXPENSE",
      description: "REAJUSTE",
      amount: "40.00",
      creditCardId: card.id,
      invoiceMonthKey: "2026-03",
      settlementStatus: null,
    });
  });
});
