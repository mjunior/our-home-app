import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  users: [] as Array<{ id: string; email: string; passwordHash: string; householdId: string }>,
  householdCount: 0,
};

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
      create: vi.fn(async ({ data }: any) => data),
      findMany: vi.fn(async ({ where }: any) => [
        {
          id: "acc-1",
          householdId: where?.householdId ?? "home-1",
          name: "Conta Principal",
          type: "CHECKING",
          openingBalance: { toString: () => "0.00" },
        },
      ]),
    },
    creditCard: { create: vi.fn(async ({ data }: any) => data) },
    category: { create: vi.fn(async ({ data }: any) => data) },
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
});
