import { Readable } from "node:stream";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { AccountsController } from "../../src/modules/accounts/accounts.controller";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { CardsController } from "../../src/modules/cards/cards.controller";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CardsService } from "../../src/modules/cards/cards.service";
import { CategoriesController } from "../../src/modules/categories/categories.controller";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { CategoriesService } from "../../src/modules/categories/categories.service";
import { FreeBalancePolicy } from "../../src/modules/free-balance/free-balance.policy";
import { FreeBalanceService } from "../../src/modules/free-balance/free-balance.service";
import { InvoiceCycleService } from "../../src/modules/invoices/invoice-cycle.service";
import { InstallmentsService } from "../../src/modules/scheduling/installments.service";
import { RecurrenceService } from "../../src/modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../src/modules/scheduling/schedule-engine.service";
import { ScheduleManagementController } from "../../src/modules/scheduling/schedule-management.controller";
import { ScheduleManagementService } from "../../src/modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsController } from "../../src/modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const apiState = {
  users: [] as Array<{ id: string; email: string; passwordHash: string; householdId: string }>,
  accounts: [] as Array<{
    id: string;
    householdId: string;
    name: string;
    type: "CHECKING" | "INVESTMENT";
    openingBalance: ReturnType<typeof decimal>;
    goalAmount: ReturnType<typeof decimal> | null;
  }>,
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
        if (where.email) return apiState.users.find((item) => item.email === where.email) ?? null;
        if (where.id) return apiState.users.find((item) => item.id === where.id) ?? null;
        return null;
      }),
    },
    household: {
      create: vi.fn(async () => ({ id: `home-${++apiState.householdCount}` })),
    },
    account: {
      create: vi.fn(async ({ data }: any) => {
        const created = {
          id: `acc-${apiState.accounts.length + 1}`,
          ...data,
          openingBalance: decimal(String(data.openingBalance)),
          goalAmount: data.goalAmount == null ? null : decimal(String(data.goalAmount)),
        };
        apiState.accounts.push(created);
        return created;
      }),
      findMany: vi.fn(async ({ where }: any = {}) =>
        apiState.accounts.filter((item) => !where?.householdId || item.householdId === where.householdId),
      ),
      findUnique: vi.fn(async ({ where }: any) => apiState.accounts.find((item) => item.id === where.id) ?? null),
    },
    creditCard: {
      count: vi.fn(async ({ where }: any = {}) =>
        apiState.cards.filter((item) => !where?.householdId || item.householdId === where.householdId).length,
      ),
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `card-${apiState.cards.length + 1}`, ...data };
        apiState.cards.push(created);
        return created;
      }),
      findMany: vi.fn(async ({ where }: any = {}) =>
        apiState.cards.filter((item) => !where?.householdId || item.householdId === where.householdId),
      ),
      findUnique: vi.fn(async ({ where }: any) => apiState.cards.find((item) => item.id === where.id) ?? null),
    },
    category: {
      create: vi.fn(async ({ data }: any) => {
        const created = { id: `cat-${apiState.categories.length + 1}`, ...data };
        apiState.categories.push(created);
        return created;
      }),
      findMany: vi.fn(async ({ where }: any = {}) =>
        apiState.categories.filter((item) => !where?.householdId || item.householdId === where.householdId),
      ),
      findFirst: vi.fn(async ({ where }: any) =>
        apiState.categories.find((item) => item.householdId === where.householdId && item.normalized === where.normalized) ?? null,
      ),
      upsert: vi.fn(async ({ where, create }: any) => {
        const existing = apiState.categories.find(
          (item) =>
            item.householdId === where.householdId_normalized.householdId &&
            item.normalized === where.householdId_normalized.normalized,
        );
        if (existing) return existing;
        const created = { id: `cat-${apiState.categories.length + 1}`, ...create };
        apiState.categories.push(created);
        return created;
      }),
    },
    transaction: {
      findMany: vi.fn(async ({ where }: any = {}) =>
        apiState.transactions.filter((item) => {
          if (where?.householdId && item.householdId !== where.householdId) return false;
          if (where?.accountId && item.accountId !== where.accountId) return false;
          if (where?.creditCardId && item.creditCardId !== where.creditCardId) return false;
          return true;
        }),
      ),
      create: vi.fn(async ({ data }: any) => {
        const created = {
          id: `tx-${apiState.transactions.length + 1}`,
          ...data,
          amount: decimal(String(data.amount)),
          occurredAt: data.occurredAt instanceof Date ? data.occurredAt : date(data.occurredAt),
          invoiceDueDate: data.invoiceDueDate instanceof Date || data.invoiceDueDate === null ? data.invoiceDueDate : date(data.invoiceDueDate),
          createdAt: date("2026-04-15T12:00:00.000Z"),
        };
        apiState.transactions.push(created);
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
            const created = { id: `user-${apiState.users.length + 1}`, ...data };
            apiState.users.push(created);
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

const householdId = "household-main";

const accountsRepo = new AccountsRepository();
const cardsRepo = new CardsRepository();
const categoriesRepo = new CategoriesRepository();
const transactionsRepo = new TransactionsRepository();
const scheduleRepo = new ScheduleRepository();

const accountsController = new AccountsController(new AccountsService(accountsRepo, transactionsRepo, undefined, scheduleRepo));
const cardsController = new CardsController(new CardsService(cardsRepo));
const categoriesController = new CategoriesController(new CategoriesService(categoriesRepo));
const transactionsController = new TransactionsController(
  new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
);
const scheduleManagementController = new ScheduleManagementController(
  new ScheduleManagementService(
    scheduleRepo,
    new InstallmentsService(scheduleRepo, new ScheduleEngineService()),
    new RecurrenceService(scheduleRepo, new ScheduleEngineService()),
    new ScheduleEngineService(),
    new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
  ),
);
const freeBalanceService = new FreeBalanceService(
  accountsRepo,
  cardsRepo,
  transactionsRepo,
  scheduleRepo,
  new InvoiceCycleService(),
  new FreeBalancePolicy(),
);

type Handler = (req: any, res: any, next: () => void) => void | Promise<void>;

let apiHandler: Handler | null = null;

installViteApi({
  middlewares: {
    use(nextHandler) {
      apiHandler = nextHandler;
    },
  },
});

async function apiRequest(input: { method: string; url: string; body?: unknown; cookie?: string }) {
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

  await apiHandler?.(req, res, () => undefined);

  return {
    status: res.statusCode,
    body: payload ? JSON.parse(payload) : {},
    headers,
  };
}

async function registerApiUser(email: string) {
  const registered = await apiRequest({
    method: "POST",
    url: "/api/auth/register",
    body: { email, password: "secret12" },
  });
  return {
    householdId: registered.body.user.householdId as string,
    cookie: String(registered.headers.get("Set-Cookie")).split(";")[0],
  };
}

describe("foundation api", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();
    apiState.users.length = 0;
    apiState.accounts.length = 0;
    apiState.cards.length = 0;
    apiState.categories.length = 0;
    apiState.transactions.length = 0;
    apiState.householdCount = 0;
  });

  it("creates and lists accounts with consolidated balance", () => {
    const checking = accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.50",
    });

    const investment = accountsController.createAccount({
      householdId,
      name: "Conta Investimento",
      type: "INVESTMENT",
      openingBalance: "200.10",
      goalAmount: "500.00",
    });

    expect(accountsController.listAccounts(householdId)).toHaveLength(2);
    expect(accountsController.getConsolidatedBalance(householdId)).toEqual({
      amount: "1200.60",
      byType: {
        CHECKING: "1000.50",
        INVESTMENT: "200.10",
      },
      accounts: [
        {
          id: checking.id,
          name: "Conta Principal",
          type: "CHECKING",
          balance: "1000.50",
          goalAmount: null,
          goalProgressPercent: null,
          remainingToGoal: null,
          goalReached: false,
        },
        {
          id: investment.id,
          name: "Conta Investimento",
          type: "INVESTMENT",
          balance: "200.10",
          goalAmount: "500.00",
          goalProgressPercent: 40.02,
          remainingToGoal: "299.90",
          goalReached: false,
        },
      ],
    });
  });

  it("updates investment goal and clamps remaining value when target is reached", () => {
    const investment = accountsController.createAccount({
      householdId,
      name: "Reserva Longo Prazo",
      type: "INVESTMENT",
      openingBalance: "200.00",
      goalAmount: "1000.00",
    });
    const category = categoriesController.createCategory({ householdId, name: "Investimentos" });

    accountsController.updateAccountGoal({
      householdId,
      id: investment.id,
      goalAmount: "300.00",
    });

    transactionsController.createInvestmentTransfer({
      householdId,
      description: "Aporte objetivo",
      amount: "150.00",
      occurredAt: "2026-03-10T12:00:00.000Z",
      categoryId: category.id,
      sourceAccountId: accountsController.createAccount({
        householdId,
        name: "Conta Base",
        type: "CHECKING",
        openingBalance: "150.00",
      }).id,
      destinationAccountId: investment.id,
    });

    const consolidated = accountsController.getConsolidatedBalance(householdId);
    expect(consolidated.accounts.find((account) => account.id === investment.id)).toEqual({
      id: investment.id,
      name: "Reserva Longo Prazo",
      type: "INVESTMENT",
      balance: "350.00",
      goalAmount: "300.00",
      goalProgressPercent: 100,
      remainingToGoal: "0.00",
      goalReached: true,
    });
  });

  it("validates card cycle days", () => {
    expect(() =>
      cardsController.createCard({
        householdId,
        name: "Cartao Azul",
        closeDay: 32,
        dueDay: 10,
      }),
    ).toThrow("closeDay must be an integer between 1 and 31");

    const created = cardsController.createCard({
      householdId,
      name: "Cartao Verde",
      closeDay: 5,
      dueDay: 12,
    });

    expect(created.closeDay).toBe(5);
    expect(cardsController.listCards(householdId)).toHaveLength(1);
  });

  it("updates card close/due days without backfilling existing transactions", () => {
    const card = cardsController.createCard({
      householdId,
      name: "Cartao Editavel",
      closeDay: 5,
      dueDay: 10,
    });
    const category = categoriesController.createCategory({ householdId, name: "Compras" });

    const beforeEdit = transactionsController.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra antiga",
      amount: "100.00",
      occurredAt: "2026-04-04T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const updatedCard = cardsController.updateCard({
      id: card.id,
      householdId,
      name: "Cartao Editavel",
      closeDay: 2,
      dueDay: 20,
    });

    expect(updatedCard.closeDay).toBe(2);
    expect(updatedCard.dueDay).toBe(20);

    const afterEdit = transactionsController.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra nova",
      amount: "100.00",
      occurredAt: "2026-04-04T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    expect(beforeEdit.invoiceMonthKey).toBe("2026-04");
    expect(beforeEdit.invoiceDueDate).toBe("2026-04-10T00:00:00.000Z");
    expect(afterEdit.invoiceMonthKey).toBe("2026-05");
    expect(afterEdit.invoiceDueDate).toBe("2026-05-20T00:00:00.000Z");
  });

  it("prevents duplicate normalized categories", () => {
    categoriesController.createCategory({ householdId, name: "Mercado" });

    expect(() => {
      categoriesController.createCategory({ householdId, name: " mercado " });
    }).toThrow("CATEGORY_DUPLICATE");

    expect(categoriesController.listCategories(householdId)).toHaveLength(1);
  });

  it("returns explainable free balance payload for dashboard consumption", () => {
    const account = accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "500.00",
    });
    const card = cardsController.createCard({
      householdId,
      name: "Cartao Casa",
      closeDay: 5,
      dueDay: 12,
    });
    const category = categoriesController.createCategory({ householdId, name: "Casa" });

    transactionsController.createTransaction({
      householdId,
      kind: "INCOME",
      description: "Salario",
      amount: "2000.00",
      occurredAt: "2026-03-01T12:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });
    transactionsController.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra cartao",
      amount: "250.00",
      occurredAt: "2026-03-03T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const result = freeBalanceService.getFreeBalance({ householdId, month: "2026-03" });

    expect(result.breakdown.current.month).toBe("2026-03");
    expect(result.breakdown.current.components.cardInvoiceDue).toBe("250.00");
    expect(result.topDrivers.length).toBeGreaterThan(0);
  });

  it("keeps total consolidated unchanged on internal investment transfer while changing account balances", () => {
    const checking = accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const investment = accountsController.createAccount({
      householdId,
      name: "Reserva",
      type: "INVESTMENT",
      openingBalance: "0.00",
    });
    const category = categoriesController.createCategory({ householdId, name: "Investimentos" });

    transactionsController.createInvestmentTransfer({
      householdId,
      description: "Aporte mensal",
      amount: "250.00",
      occurredAt: "2026-03-10T12:00:00.000Z",
      categoryId: category.id,
      sourceAccountId: checking.id,
      destinationAccountId: investment.id,
    });

    const consolidated = accountsController.getConsolidatedBalance(householdId);
    expect(consolidated.amount).toBe("1000.00");
    expect(consolidated.byType).toEqual({
      CHECKING: "750.00",
      INVESTMENT: "250.00",
    });
    expect(consolidated.accounts).toEqual([
      {
        id: checking.id,
        name: "Conta Principal",
        type: "CHECKING",
        balance: "750.00",
        goalAmount: null,
        goalProgressPercent: null,
        remainingToGoal: null,
        goalReached: false,
      },
      {
        id: investment.id,
        name: "Reserva",
        type: "INVESTMENT",
        balance: "250.00",
        goalAmount: null,
        goalProgressPercent: null,
        remainingToGoal: null,
        goalReached: false,
      },
    ]);
  });

  it("ignores unpaid account movements in consolidated balance", () => {
    const checking = accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const category = categoriesController.createCategory({ householdId, name: "Casa" });

    transactionsController.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Conta de luz",
      amount: "120.00",
      occurredAt: "2026-03-10T12:00:00.000Z",
      accountId: checking.id,
      categoryId: category.id,
      settlementStatus: "UNPAID",
    });

    const consolidated = accountsController.getConsolidatedBalance(householdId);
    expect(consolidated.amount).toBe("1000.00");
    expect(consolidated.accounts).toEqual([
      {
        id: checking.id,
        name: "Conta Principal",
        type: "CHECKING",
        balance: "1000.00",
        goalAmount: null,
        goalProgressPercent: null,
        remainingToGoal: null,
        goalReached: false,
      },
    ]);
  });

  it("includes future recurring movement once marked as paid", () => {
    const checking = accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });

    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "RECURRING",
      sourceId: "rule-salary",
      sequence: 1,
      monthKey: "2026-04",
      occurredAt: "2026-04-01T12:00:00.000Z",
      kind: "INCOME",
      description: "Adiantamento salario",
      amount: "500.00",
      categoryId: "cat-salary",
      accountId: checking.id,
      creditCardId: null,
      instanceKey: "RECURRING:rule-salary:1:2026-04",
      locked: false,
      settlementStatus: "PAID",
    });

    const consolidated = accountsController.getConsolidatedBalance(householdId);
    expect(consolidated.amount).toBe("1500.00");
    expect(consolidated.accounts).toEqual([
      {
        id: checking.id,
        name: "Conta Principal",
        type: "CHECKING",
        balance: "1500.00",
        goalAmount: null,
        goalProgressPercent: null,
        remainingToGoal: null,
        goalReached: false,
      },
    ]);
  });

  it("account adjustment API returns a null transaction without writing when balance is unchanged", async () => {
    const { householdId: apiHouseholdId, cookie } = await registerApiUser("account-adjustment@home.app");
    const account = apiState.accounts.find((item) => item.householdId === apiHouseholdId)!;
    const categoryCountBefore = apiState.categories.length;
    const transactionCountBefore = apiState.transactions.length;

    const result = await apiRequest({
      method: "POST",
      url: "/api/accounts/adjustment",
      cookie,
      body: {
        accountId: account.id,
        realBalance: "0.00",
        month: "2026-04",
        occurredAt: "2026-04-15T12:00:00.000Z",
      },
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      previousBalance: "0.00",
      realBalance: "0.00",
      difference: "0.00",
      transaction: null,
    });
    expect(apiState.transactions).toHaveLength(transactionCountBefore);
    expect(apiState.categories).toHaveLength(categoryCountBefore);
  });

  it("credit card adjustment API returns a null transaction without writing when invoice total is unchanged", async () => {
    const { householdId: apiHouseholdId, cookie } = await registerApiUser("card-adjustment@home.app");
    const card = apiState.cards.find((item) => item.householdId === apiHouseholdId)!;
    const category = apiState.categories.find((item) => item.householdId === apiHouseholdId)!;
    apiState.transactions.push({
      id: "tx-base",
      householdId: apiHouseholdId,
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
    const categoryCountBefore = apiState.categories.length;
    const transactionCountBefore = apiState.transactions.length;

    const result = await apiRequest({
      method: "POST",
      url: "/api/invoices/adjustment",
      cookie,
      body: {
        cardId: card.id,
        realInvoiceTotal: "100.00",
        dueMonth: "2026-03",
        occurredAt: "2026-03-15T12:00:00.000Z",
      },
    });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({
      previousInvoiceTotal: "100.00",
      realInvoiceTotal: "100.00",
      difference: "0.00",
      transaction: null,
    });
    expect(apiState.transactions).toHaveLength(transactionCountBefore);
    expect(apiState.categories).toHaveLength(categoryCountBefore);
  });

  it("edits a recurring instance with THIS_ONLY scope without revising the recurring rule", () => {
    const checking = accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const category = categoriesController.createCategory({ householdId, name: "Casa" });

    const rule = scheduleManagementController.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Academia",
      amount: "100.00",
      startMonth: "2026-03",
      categoryId: category.id,
      accountId: checking.id,
    });

    scheduleManagementController.editRecurringSchedule({
      ruleId: rule.id,
      effectiveMonth: "2026-04",
      scope: "THIS_ONLY",
      amount: "145.00",
      description: "Academia ajuste",
    });

    const april = scheduleRepo.findInstanceBySourceMonth("RECURRING", rule.id, "2026-04");
    const may = scheduleRepo.findInstanceBySourceMonth("RECURRING", rule.id, "2026-05");

    expect(scheduleRepo.listRecurringRules(householdId)).toHaveLength(1);
    expect(april?.amount).toBe("145.00");
    expect(april?.description).toBe("Academia ajuste");
    expect(may?.amount).toBe("100.00");
    expect(scheduleRepo.findRecurringRuleById(rule.id)?.active).toBe(true);
  });
});
