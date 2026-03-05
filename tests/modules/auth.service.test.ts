import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  households: [] as Array<{ id: string }>,
  users: [] as Array<{ id: string; email: string; passwordHash: string; householdId: string }>,
  accounts: [] as Array<{ householdId: string; name: string; type: string; openingBalance: string }>,
  cards: [] as Array<{ householdId: string; name: string; closeDay: number; dueDay: number }>,
  categories: [] as Array<{ householdId: string; name: string; normalized: string }>,
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
      create: vi.fn(async () => {
        const household = { id: `home-${state.households.length + 1}` };
        state.households.push(household);
        return household;
      }),
    },
    account: {
      create: vi.fn(async ({ data }: any) => {
        state.accounts.push(data);
        return data;
      }),
    },
    creditCard: {
      create: vi.fn(async ({ data }: any) => {
        state.cards.push(data);
        return data;
      }),
    },
    category: {
      create: vi.fn(async ({ data }: any) => {
        state.categories.push(data);
        return data;
      }),
    },
    $transaction: vi.fn(async (callback: any) => {
      const tx = {
        household: prisma.household,
        account: prisma.account,
        creditCard: prisma.creditCard,
        category: prisma.category,
        user: {
          create: vi.fn(async ({ data }: any) => {
            const user = { id: `user-${state.users.length + 1}`, ...data };
            state.users.push(user);
            return user;
          }),
        },
      };
      return callback(tx);
    }),
  };

  return { prisma };
});

import { AuthService } from "../../src/modules/auth/auth.service";

const auth = new AuthService();

describe("auth service", () => {
  beforeEach(() => {
    state.households.length = 0;
    state.users.length = 0;
    state.accounts.length = 0;
    state.cards.length = 0;
    state.categories.length = 0;
  });

  it("creates user + baseline data and never stores plaintext", async () => {
    const created = await auth.register({ email: "owner@home.app", password: "secret12" });

    expect(created.email).toBe("owner@home.app");
    expect(created.householdId).toBe("home-1");
    expect(state.users[0]?.passwordHash).toContain("scrypt:");
    expect(state.users[0]?.passwordHash).not.toContain("secret12");
    expect(state.accounts).toHaveLength(1);
    expect(state.cards).toHaveLength(1);
    expect(state.categories.length).toBeGreaterThanOrEqual(5);
  });

  it("blocks duplicate email", async () => {
    await auth.register({ email: "owner@home.app", password: "secret12" });

    await expect(auth.register({ email: "owner@home.app", password: "other123" })).rejects.toMatchObject({
      code: "AUTH_EMAIL_ALREADY_USED",
    });
  });

  it("authenticates valid credentials and rejects invalid ones", async () => {
    const created = await auth.register({ email: "owner@home.app", password: "secret12" });

    await expect(auth.authenticate({ email: "owner@home.app", password: "secret12" })).resolves.toEqual(created);
    await expect(auth.authenticate({ email: "owner@home.app", password: "wrong" })).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
    });
  });
});
