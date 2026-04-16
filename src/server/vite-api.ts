import Decimal from "decimal.js";

import { InvoiceCycleService } from "../modules/invoices/invoice-cycle.service";
import { InvoicesService } from "../modules/invoices/invoices.service";
import { FreeBalancePolicy } from "../modules/free-balance/free-balance.policy";
import { FreeBalanceService } from "../modules/free-balance/free-balance.service";
import { HOUSEHOLD_FINANCE_CATEGORIES } from "../modules/categories/bootstrap-categories";
import { AuthService } from "../modules/auth/auth.service";
import { AuthError, isAuthError } from "../modules/auth/auth.errors";
import { issueSessionToken, verifySessionToken } from "../modules/auth/session-token";
import { prisma } from "../modules/shared/persistence/prisma";

const sessionCookieName = "ourhome_session";
const sessionTtlSeconds = 60 * 60 * 24 * 7;

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? "dev-auth-session-secret-change-me";
}

function parseCookieHeader(raw: string | undefined) {
  if (!raw) {
    return {};
  }

  return raw.split(";").reduce<Record<string, string>>((acc, part) => {
    const [key, ...value] = part.trim().split("=");
    if (!key) {
      return acc;
    }
    acc[key] = decodeURIComponent(value.join("=") ?? "");
    return acc;
  }, {});
}

function buildSessionCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${sessionCookieName}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${sessionTtlSeconds}${secure}`;
}

function buildSessionClearCookie() {
  return `${sessionCookieName}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

async function resolveSessionUser(req: any, auth: AuthService) {
  const cookies = parseCookieHeader(req.headers?.cookie);
  const token = cookies[sessionCookieName];
  if (!token) return null;

  const claims = verifySessionToken(token, getSessionSecret());
  if (!claims) return null;

  return auth.getUserById(claims.sub);
}

class AccountsReadRepository {
  constructor(
    private readonly rows: Array<{
      id: string;
      householdId: string;
      name: string;
      type: "CHECKING" | "INVESTMENT";
      openingBalance: string;
      goalAmount: string | null;
    }>,
  ) {}
  listByHousehold(householdId: string) { return this.rows.filter((item) => item.householdId === householdId); }
  findById(id: string) { return this.rows.find((item) => item.id === id); }
}
class CardsReadRepository {
  constructor(private readonly rows: Array<{ id: string; householdId: string; name: string; closeDay: number; dueDay: number }>) {}
  listByHousehold(householdId: string) { return this.rows.filter((item) => item.householdId === householdId); }
  findById(id: string) { return this.rows.find((item) => item.id === id); }
}
class TransactionsReadRepository {
  constructor(private readonly rows: Array<any>) {}
  listByHousehold(householdId: string) { return this.rows.filter((item) => item.householdId === householdId); }
  listByHouseholdMonth(householdId: string, filter: { month: string; accountId?: string; creditCardId?: string; categoryId?: string }) {
    return this.rows.filter((item) => {
      if (item.householdId !== householdId) return false;
      if (item.occurredAt.slice(0, 7) !== filter.month) return false;
      if (filter.accountId && item.accountId !== filter.accountId) return false;
      if (filter.creditCardId && item.creditCardId !== filter.creditCardId) return false;
      if (filter.categoryId && item.categoryId !== filter.categoryId) return false;
      return true;
    });
  }
}
class ScheduleReadRepository {
  constructor(
    private readonly rows: Array<any>,
    private readonly installmentPlans: Array<any> = [],
    private readonly recurringRules: Array<any> = [],
  ) {}
  listInstancesByHousehold(householdId: string) { return this.rows.filter((item) => item.householdId === householdId); }
  findInstallmentPlanById(id: string) { return this.installmentPlans.find((item) => item.id === id); }
  findRecurringRuleById(id: string) { return this.recurringRules.find((item) => item.id === id); }
}
class InvoiceSettlementReadRepository {
  constructor(private readonly rows: Array<any>) {}
  listByHousehold(householdId: string) { return this.rows.filter((item) => item.householdId === householdId); }
  upsert(data: any) {
    const existing = this.rows.find(
      (item) => item.householdId === data.householdId && item.cardId === data.cardId && item.dueMonth === data.dueMonth,
    );
    if (existing) {
      Object.assign(existing, data);
      return existing;
    }
    const created = { id: `mem:${Date.now()}:${Math.random()}`, ...data };
    this.rows.push(created);
    return created;
  }
  remove(input: { householdId: string; cardId: string; dueMonth: string }) {
    const before = this.rows.length;
    for (let index = this.rows.length - 1; index >= 0; index -= 1) {
      const item = this.rows[index];
      if (!item) continue;
      if (item.householdId === input.householdId && item.cardId === input.cardId && item.dueMonth === input.dueMonth) {
        this.rows.splice(index, 1);
      }
    }
    return { deleted: this.rows.length !== before };
  }
}

async function readJsonBody(req: any): Promise<any> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(chunk);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res: any, code: number, payload: unknown) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function isGoalType(value: unknown): value is "FINANCIAL" | "PERSONAL" | "FAMILY" | "DREAM" {
  return value === "FINANCIAL" || value === "PERSONAL" || value === "FAMILY" || value === "DREAM";
}

function isGoalMetricType(value: unknown): value is "PERCENTAGE" | "QUANTITY" | "OCCURRENCE" {
  return value === "PERCENTAGE" || value === "QUANTITY" || value === "OCCURRENCE";
}

function normalizeGoalDate(raw: unknown): Date | null {
  if (raw == null || raw === "") {
    return null;
  }
  const normalized = typeof raw === "string" && raw.length === 10 ? `${raw}T00:00:00.000Z` : String(raw);
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error("GOAL_INVALID_INPUT");
  }
  return parsed;
}

function normalizeGoalMetricInput(input: { metricType: unknown; metricValue: unknown; metricTarget: unknown }) {
  if (!isGoalMetricType(input.metricType)) {
    throw new Error("GOAL_INVALID_INPUT");
  }

  const metricValue = Number(input.metricValue);
  if (!Number.isInteger(metricValue) || metricValue < 0) {
    throw new Error("GOAL_INVALID_INPUT");
  }

  if (input.metricType === "PERCENTAGE") {
    if (metricValue > 100) {
      throw new Error("GOAL_INVALID_INPUT");
    }
    return { metricType: input.metricType, metricValue, metricTarget: null as number | null };
  }

  if (input.metricType === "QUANTITY") {
    const metricTarget = Number(input.metricTarget);
    if (!Number.isInteger(metricTarget) || metricTarget <= 0) {
      throw new Error("GOAL_INVALID_INPUT");
    }
    return { metricType: input.metricType, metricValue, metricTarget };
  }

  if (input.metricTarget == null || input.metricTarget === "") {
    return { metricType: input.metricType, metricValue, metricTarget: null as number | null };
  }

  const metricTarget = Number(input.metricTarget);
  if (!Number.isInteger(metricTarget) || metricTarget <= 0) {
    throw new Error("GOAL_INVALID_INPUT");
  }
  return { metricType: input.metricType, metricValue, metricTarget };
}

function toGoalDto(goal: {
  id: string;
  householdId: string;
  title: string;
  description: string;
  type: "FINANCIAL" | "PERSONAL" | "FAMILY" | "DREAM";
  targetDate: Date | null;
  metricType: "PERCENTAGE" | "QUANTITY" | "OCCURRENCE";
  metricValue: number;
  metricTarget: number | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const progressPercent =
    goal.metricType === "PERCENTAGE"
      ? Math.max(0, Math.min(100, goal.metricValue))
      : goal.metricTarget && goal.metricTarget > 0
        ? Math.max(0, Math.min(100, Math.round((goal.metricValue / goal.metricTarget) * 100)))
        : 0;

  return {
    ...goal,
    progressPercent,
    targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString(),
  };
}

function addMonths(monthKey: string, count: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

function toOccurredAt(monthKey: string) {
  return new Date(`${monthKey}-01T12:00:00.000Z`);
}

function buildInstanceKey(sourceType: "RECURRING" | "INSTALLMENT", sourceId: string, sequence: number, monthKey: string) {
  return `${sourceType}:${sourceId}:${sequence}:${monthKey}`;
}

function normalizeAccountGoalAmount(raw: unknown, type: "CHECKING" | "INVESTMENT") {
  if (raw == null || raw === "") {
    return null;
  }

  if (type !== "INVESTMENT") {
    throw new Error("ACCOUNT_GOAL_ONLY_FOR_INVESTMENT");
  }

  const goalAmount = Number(raw);
  if (Number.isNaN(goalAmount) || goalAmount <= 0) {
    throw new Error("ACCOUNT_GOAL_INVALID");
  }

  return String(raw);
}

function splitInstallments(totalAmount: string, count: number): string[] {
  const totalCents = Math.round(Number(totalAmount) * 100);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents - baseCents * count;
  const values = new Array<string>(count).fill((baseCents / 100).toFixed(2));

  for (let index = 0; index < remainder; index += 1) {
    const current = Number(values[index]);
    values[index] = (current + 0.01).toFixed(2);
  }

  return values;
}

async function resolveInvoiceFieldsForTransaction(input: {
  householdId: string;
  kind: "INCOME" | "EXPENSE";
  occurredAt: string;
  creditCardId?: string | null;
}) {
  if (input.kind !== "EXPENSE" || !input.creditCardId) {
    return {
      invoiceMonthKey: null,
      invoiceDueDate: null,
    };
  }

  const card = await prisma.creditCard.findUnique({ where: { id: input.creditCardId } });
  if (!card || card.householdId !== input.householdId) {
    throw new Error("CARD_NOT_FOUND");
  }

  const cycle = new InvoiceCycleService().resolveExpenseCycle(input.occurredAt, card.closeDay, card.dueDay);
  return {
    invoiceMonthKey: cycle.monthKey,
    invoiceDueDate: new Date(cycle.dueDate),
  };
}

async function createRecurringInstances(input: {
  householdId: string;
  sourceId: string;
  startMonth: string;
  endMonth: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  categoryId: string;
  accountId?: string | null;
  creditCardId?: string | null;
}) {
  let sequence = 1;
  for (let month = input.startMonth; month <= input.endMonth; month = addMonths(month, 1)) {
    const instanceKey = buildInstanceKey("RECURRING", input.sourceId, sequence, month);
    const exists = await prisma.scheduledInstance.findUnique({ where: { instanceKey } });
    if (!exists) {
      await prisma.scheduledInstance.create({
        data: {
          householdId: input.householdId,
          sourceType: "RECURRING",
          sourceId: input.sourceId,
          sequence,
          monthKey: month,
          occurredAt: toOccurredAt(month),
          kind: input.kind,
          description: input.description,
          amount: input.amount,
          categoryId: input.categoryId,
          accountId: input.accountId ?? null,
          creditCardId: input.creditCardId ?? null,
          instanceKey,
          locked: false,
          settlementStatus: input.accountId ? "UNPAID" : null,
        },
      });
    }
    sequence += 1;
  }
}

async function createInstallmentInstances(input: {
  householdId: string;
  sourceId: string;
  startMonth: string;
  description: string;
  totalAmount: string;
  installmentsCount: number;
  categoryId: string;
  accountId?: string | null;
  creditCardId?: string | null;
}) {
  const splits = splitInstallments(input.totalAmount, input.installmentsCount);

  for (let index = 0; index < input.installmentsCount; index += 1) {
    const sequence = index + 1;
    const month = addMonths(input.startMonth, index);
    const instanceKey = buildInstanceKey("INSTALLMENT", input.sourceId, sequence, month);
    const exists = await prisma.scheduledInstance.findUnique({ where: { instanceKey } });
    if (!exists) {
      await prisma.scheduledInstance.create({
        data: {
          householdId: input.householdId,
          sourceType: "INSTALLMENT",
          sourceId: input.sourceId,
          sequence,
          monthKey: month,
          occurredAt: toOccurredAt(month),
          kind: "EXPENSE",
          description: `${input.description} (${sequence}/${input.installmentsCount})`,
          amount: splits[index],
          categoryId: input.categoryId,
          accountId: input.accountId ?? null,
          creditCardId: input.creditCardId ?? null,
          instanceKey,
          locked: false,
          settlementStatus: input.accountId ? "PAID" : null,
        },
      });
    }
  }
}

function toTransactionDto(row: any) {
  return {
    id: row.id,
    householdId: row.householdId,
    kind: row.kind,
    description: row.description,
    amount: row.amount.toString(),
    occurredAt: row.occurredAt.toISOString(),
    accountId: row.accountId,
    creditCardId: row.creditCardId,
    categoryId: row.categoryId,
    invoiceMonthKey: row.invoiceMonthKey,
    invoiceDueDate: row.invoiceDueDate ? row.invoiceDueDate.toISOString() : null,
    settlementStatus: row.settlementStatus ?? null,
    transferGroupId: row.transferGroupId ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

async function calculatePersistedAccountBalance(input: { householdId: string; accountId: string; openingBalance: string }) {
  let balance = new Decimal(input.openingBalance);
  const transactions = await prisma.transaction.findMany({
    where: {
      householdId: input.householdId,
      accountId: input.accountId,
    },
  });
  const invoiceSettlements = await prisma.invoiceSettlement.findMany({
    where: {
      householdId: input.householdId,
      paymentAccountId: input.accountId,
    },
  });
  const scheduledInstances = await prisma.scheduledInstance.findMany({
    where: {
      householdId: input.householdId,
      accountId: input.accountId,
    },
  });

  for (const item of transactions) {
    if ((item.settlementStatus ?? "PAID") !== "PAID") continue;
    const amount = new Decimal(item.amount.toString());
    balance = item.kind === "INCOME" ? balance.plus(amount) : balance.minus(amount);
  }

  for (const settlement of invoiceSettlements) {
    balance = balance.minus(new Decimal(settlement.paidAmount.toString()));
  }

  for (const instance of scheduledInstances) {
    if ((instance.settlementStatus ?? "PAID") !== "PAID") continue;
    const amount = new Decimal(instance.amount.toString());
    balance = instance.kind === "INCOME" ? balance.plus(amount) : balance.minus(amount);
  }

  return balance.toFixed(2);
}

function assertInvestmentTypes(source: any, destination: any) {
  if (source.type !== "CHECKING") {
    throw new Error("INVESTMENT_SOURCE_MUST_BE_CHECKING");
  }
  if (destination.type !== "INVESTMENT") {
    throw new Error("INVESTMENT_DESTINATION_MUST_BE_INVESTMENT");
  }
}

async function createInvestmentTransfer(body: any, authHouseholdId: string) {
  const source = await prisma.account.findUnique({ where: { id: body.sourceAccountId } });
  const destination = await prisma.account.findUnique({ where: { id: body.destinationAccountId } });
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });

  if (!source || source.householdId !== authHouseholdId) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  if (!destination || destination.householdId !== authHouseholdId) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  if (!category || category.householdId !== authHouseholdId) {
    throw new Error("CATEGORY_NOT_FOUND");
  }
  if (source.id === destination.id) {
    throw new Error("INVESTMENT_TRANSFER_REQUIRES_DISTINCT_ACCOUNTS");
  }

  assertInvestmentTypes(source, destination);
  const transferGroupId = `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  const [debit, credit] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        householdId: authHouseholdId,
        kind: "EXPENSE",
        description: body.description,
        amount: body.amount,
        occurredAt: new Date(body.occurredAt),
        accountId: source.id,
        creditCardId: null,
        categoryId: body.categoryId,
        invoiceMonthKey: null,
        invoiceDueDate: null,
        settlementStatus: "PAID",
        transferGroupId,
      },
    }),
    prisma.transaction.create({
      data: {
        householdId: authHouseholdId,
        kind: "INCOME",
        description: body.description,
        amount: body.amount,
        occurredAt: new Date(body.occurredAt),
        accountId: destination.id,
        creditCardId: null,
        categoryId: body.categoryId,
        invoiceMonthKey: null,
        invoiceDueDate: null,
        settlementStatus: "PAID",
        transferGroupId,
      },
    }),
  ]);

  return { transferGroupId, debit: toTransactionDto(debit), credit: toTransactionDto(credit) };
}

async function loadServices() {
  const accounts = await prisma.account.findMany();
  const cards = await prisma.creditCard.findMany();
  const transactions = await prisma.transaction.findMany();
  const instances = await prisma.scheduledInstance.findMany();
  const installmentPlans = await prisma.installmentPlan.findMany();
  const recurringRules = await prisma.recurringRule.findMany();
  const invoiceSettlements = await prisma.invoiceSettlement.findMany();

  const accountRepo = new AccountsReadRepository(accounts.map((item) => ({
    id: item.id,
    householdId: item.householdId,
    name: item.name,
    type: item.type,
    openingBalance: item.openingBalance.toString(),
    goalAmount: item.goalAmount?.toString() ?? null,
  })));

  const cardRepo = new CardsReadRepository(cards.map((item) => ({
    id: item.id,
    householdId: item.householdId,
    name: item.name,
    closeDay: item.closeDay,
    dueDay: item.dueDay,
  })));

  const transactionRepo = new TransactionsReadRepository(transactions.map(toTransactionDto));
  const scheduleRepo = new ScheduleReadRepository(
    instances.map((item) => ({
      id: item.id,
      householdId: item.householdId,
      sourceType: item.sourceType,
      sourceId: item.sourceId,
      sequence: item.sequence,
      monthKey: item.monthKey,
      occurredAt: item.occurredAt.toISOString(),
      kind: item.kind,
      description: item.description,
      amount: item.amount.toString(),
      categoryId: item.categoryId,
      accountId: item.accountId,
      creditCardId: item.creditCardId,
      instanceKey: item.instanceKey,
      locked: item.locked,
      settlementStatus: item.settlementStatus ?? null,
    })),
    installmentPlans.map((item) => ({
      ...item,
      totalAmount: item.totalAmount.toString(),
      createdAt: item.createdAt.toISOString(),
    })),
    recurringRules.map((item) => ({
      ...item,
      amount: item.amount.toString(),
      createdAt: item.createdAt.toISOString(),
    })),
  );
  const invoiceSettlementRepo = new InvoiceSettlementReadRepository(invoiceSettlements.map((item) => ({
    id: item.id,
    householdId: item.householdId,
    cardId: item.cardId,
    dueMonth: item.dueMonth,
    paymentAccountId: item.paymentAccountId,
    paidAt: item.paidAt.toISOString(),
    paidAmount: item.paidAmount.toString(),
  })));

  const cycleService = new InvoiceCycleService();

  return {
    invoicesService: new InvoicesService(
      transactionRepo as any,
      cardRepo as any,
      cycleService,
      scheduleRepo as any,
      invoiceSettlementRepo as any,
    ),
    freeBalanceService: new FreeBalanceService(
      accountRepo as any,
      cardRepo as any,
      transactionRepo as any,
      scheduleRepo as any,
      cycleService,
      new FreeBalancePolicy(),
      invoiceSettlementRepo as any,
    ),
  };
}

async function ensureBootstrap(householdId: string) {
  const cardsCount = await prisma.creditCard.count({ where: { householdId } });
  if (cardsCount === 0) {
    await prisma.creditCard.create({
      data: { householdId, name: "Cartao Principal", closeDay: 5, dueDay: 12 },
    });
  }

  for (const category of HOUSEHOLD_FINANCE_CATEGORIES) {
    const normalized = normalizeName(category);
    const exists = await prisma.category.findFirst({ where: { householdId, normalized } });
    if (!exists) {
      await prisma.category.create({ data: { householdId, name: category, normalized } });
    }
  }
}

type MiddlewareServer = {
  middlewares: {
    use: (handler: (req: any, res: any, next: () => void) => void | Promise<void>) => void;
  };
};

export function installViteApi(server: MiddlewareServer) {
  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }

    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      const auth = new AuthService();

      if (req.method === "POST" && path === "/api/auth/register") {
        const body = await readJsonBody(req);
        try {
          const user = await auth.register({
            email: body.email ?? "",
            password: body.password ?? "",
          });
          const token = issueSessionToken({
            userId: user.userId,
            householdId: user.householdId,
            secret: getSessionSecret(),
            ttlSeconds: sessionTtlSeconds,
          });
          res.setHeader("Set-Cookie", buildSessionCookie(token));
          sendJson(res, 200, { user });
          return;
        } catch (error) {
          if (isAuthError(error)) {
            if (error.code === "AUTH_EMAIL_ALREADY_USED") {
              sendJson(res, 409, { message: "Nao foi possivel concluir o cadastro." });
              return;
            }

            if (error.code === "AUTH_INVALID_INPUT") {
              sendJson(res, 400, { message: "Dados de cadastro invalidos." });
              return;
            }
          }

          throw error;
        }
      }

      if (req.method === "POST" && path === "/api/auth/login") {
        const body = await readJsonBody(req);
        try {
          const user = await auth.authenticate({
            email: body.email ?? "",
            password: body.password ?? "",
          });
          const token = issueSessionToken({
            userId: user.userId,
            householdId: user.householdId,
            secret: getSessionSecret(),
            ttlSeconds: sessionTtlSeconds,
          });
          res.setHeader("Set-Cookie", buildSessionCookie(token));
          sendJson(res, 200, { user });
          return;
        } catch (error) {
          if (error instanceof AuthError && error.code === "AUTH_INVALID_CREDENTIALS") {
            sendJson(res, 401, { message: "Credenciais invalidas" });
            return;
          }
          throw error;
        }
      }

      if (req.method === "POST" && path === "/api/auth/logout") {
        res.setHeader("Set-Cookie", buildSessionClearCookie());
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === "GET" && path === "/api/auth/me") {
        const user = await resolveSessionUser(req, auth);
        if (!user) {
          sendJson(res, 401, { message: "AUTH_UNAUTHENTICATED" });
          return;
        }

        sendJson(res, 200, { user });
        return;
      }

      const user = await resolveSessionUser(req, auth);
      if (!user) {
        sendJson(res, 401, { message: "AUTH_UNAUTHENTICATED" });
        return;
      }
      const authHouseholdId = user.householdId;

      if (req.method === "GET" && path === "/api/accounts") {
        const householdId = authHouseholdId;
        const rows = await prisma.account.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        sendJson(
          res,
          200,
          rows.map((item) => ({
            ...item,
            openingBalance: item.openingBalance.toString(),
            goalAmount: item.goalAmount?.toString() ?? null,
          })),
        );
        return;
      }

      if (req.method === "POST" && path === "/api/accounts") {
        const body = await readJsonBody(req);
        const goalAmount = normalizeAccountGoalAmount(body.goalAmount, body.type);
        const created = await prisma.account.create({
          data: {
            householdId: authHouseholdId,
            name: body.name,
            type: body.type,
            openingBalance: body.openingBalance,
            goalAmount,
          },
        });
        await ensureBootstrap(authHouseholdId);
        sendJson(res, 200, {
          ...created,
          openingBalance: created.openingBalance.toString(),
          goalAmount: created.goalAmount?.toString() ?? null,
        });
        return;
      }

      if (req.method === "POST" && path === "/api/accounts/edit") {
        const body = await readJsonBody(req);
        const existing = await prisma.account.findUnique({ where: { id: body.id } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }

        if (existing.type !== "INVESTMENT") {
          sendJson(res, 400, { message: "ACCOUNT_GOAL_ONLY_FOR_INVESTMENT" });
          return;
        }

        const goalAmount = normalizeAccountGoalAmount(body.goalAmount, existing.type);

        const updated = await prisma.account.update({
          where: { id: body.id },
          data: {
            goalAmount,
          },
        });

        sendJson(res, 200, {
          ...updated,
          openingBalance: updated.openingBalance.toString(),
          goalAmount: updated.goalAmount?.toString() ?? null,
        });
        return;
      }

      if (req.method === "GET" && path === "/api/accounts/consolidated") {
        const householdId = authHouseholdId;
        const rows = await prisma.account.findMany({ where: { householdId } });
        const transactions = await prisma.transaction.findMany({
          where: {
            householdId,
            accountId: { not: null },
          },
        });
        const invoiceSettlements = await prisma.invoiceSettlement.findMany({
          where: {
            householdId,
          },
        });
        const scheduledInstances = await prisma.scheduledInstance.findMany({
          where: {
            householdId,
            accountId: { not: null },
          },
        });

        const netByAccountId = new Map<string, number>();
        for (const item of transactions) {
          if (!item.accountId) continue;
          if ((item.settlementStatus ?? "PAID") !== "PAID") continue;
          const signed = item.kind === "INCOME" ? Number(item.amount.toString()) : Number(item.amount.toString()) * -1;
          netByAccountId.set(item.accountId, (netByAccountId.get(item.accountId) ?? 0) + signed);
        }
        for (const settlement of invoiceSettlements) {
          netByAccountId.set(
            settlement.paymentAccountId,
            (netByAccountId.get(settlement.paymentAccountId) ?? 0) - Number(settlement.paidAmount.toString()),
          );
        }
        for (const instance of scheduledInstances) {
          if (!instance.accountId) continue;
          if ((instance.settlementStatus ?? "PAID") !== "PAID") continue;
          const signed = instance.kind === "INCOME" ? Number(instance.amount.toString()) : Number(instance.amount.toString()) * -1;
          netByAccountId.set(instance.accountId, (netByAccountId.get(instance.accountId) ?? 0) + signed);
        }

        const accounts = rows.map((item) => {
          const opening = Number(item.openingBalance.toString());
          const movement = netByAccountId.get(item.id) ?? 0;
          const balance = (opening + movement).toFixed(2);
          const goalAmount = item.goalAmount?.toString() ?? null;
          const goalRaw = goalAmount ? Number(goalAmount) : null;
          const progressRaw = goalRaw && goalRaw > 0 ? (Number(balance) / goalRaw) * 100 : null;
          return {
            id: item.id,
            name: item.name,
            type: item.type,
            balance,
            goalAmount,
            goalProgressPercent: progressRaw == null ? null : Math.max(0, Math.min(100, Math.round(progressRaw * 100) / 100)),
            remainingToGoal: goalRaw == null ? null : Math.max(goalRaw - Number(balance), 0).toFixed(2),
            goalReached: goalRaw == null ? false : Number(balance) >= goalRaw,
          };
        });

        const amount = accounts.reduce((acc, item) => acc + Number(item.balance), 0);
        const checking = accounts
          .filter((item) => item.type === "CHECKING")
          .reduce((acc, item) => acc + Number(item.balance), 0);
        const investment = accounts
          .filter((item) => item.type === "INVESTMENT")
          .reduce((acc, item) => acc + Number(item.balance), 0);

        sendJson(res, 200, {
          amount: amount.toFixed(2),
          byType: {
            CHECKING: checking.toFixed(2),
            INVESTMENT: investment.toFixed(2),
          },
          accounts,
        });
        return;
      }

      if (req.method === "POST" && path === "/api/accounts/adjustment") {
        const body = await readJsonBody(req);
        const account = await prisma.account.findUnique({ where: { id: body.accountId } });
        if (!account || account.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }

        if (String(body.occurredAt ?? "").slice(0, 7) !== body.month) {
          sendJson(res, 400, { message: "ACCOUNT_ADJUSTMENT_MONTH_MISMATCH" });
          return;
        }

        const previousBalance = new Decimal(
          await calculatePersistedAccountBalance({
            householdId: authHouseholdId,
            accountId: account.id,
            openingBalance: account.openingBalance.toString(),
          }),
        );
        const realBalance = new Decimal(String(body.realBalance));
        const difference = realBalance.minus(previousBalance);
        const kind = difference.isNegative() ? "EXPENSE" : "INCOME";
        const normalized = normalizeName("Reajuste");
        const category = await prisma.category.upsert({
          where: {
            householdId_normalized: {
              householdId: authHouseholdId,
              normalized,
            },
          },
          create: {
            householdId: authHouseholdId,
            name: "Reajuste",
            normalized,
          },
          update: {},
        });

        const transaction = await prisma.transaction.create({
          data: {
            householdId: authHouseholdId,
            kind,
            description: "REAJUSTE",
            amount: difference.abs().toFixed(2),
            occurredAt: new Date(body.occurredAt),
            accountId: account.id,
            creditCardId: null,
            categoryId: category.id,
            invoiceMonthKey: null,
            invoiceDueDate: null,
            settlementStatus: "PAID",
            transferGroupId: null,
          },
        });

        sendJson(res, 200, {
          previousBalance: previousBalance.toFixed(2),
          realBalance: realBalance.toFixed(2),
          difference: difference.toFixed(2),
          transaction: toTransactionDto(transaction),
        });
        return;
      }

      if (req.method === "GET" && path === "/api/cards") {
        const householdId = authHouseholdId;
        const rows = await prisma.creditCard.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        sendJson(res, 200, rows);
        return;
      }

      if (req.method === "POST" && path === "/api/cards") {
        const body = await readJsonBody(req);
        const created = await prisma.creditCard.create({
          data: {
            householdId: authHouseholdId,
            name: body.name,
            closeDay: body.closeDay,
            dueDay: body.dueDay,
          },
        });
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "POST" && path === "/api/cards/edit") {
        const body = await readJsonBody(req);
        const existing = await prisma.creditCard.findUnique({ where: { id: body.id } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "CARD_NOT_FOUND" });
          return;
        }

        const updated = await prisma.creditCard.update({
          where: { id: body.id },
          data: {
            name: body.name,
            closeDay: body.closeDay,
            dueDay: body.dueDay,
          },
        });

        sendJson(res, 200, updated);
        return;
      }

      if (req.method === "POST" && path === "/api/cards/delete") {
        const body = await readJsonBody(req);
        const existing = await prisma.creditCard.findUnique({ where: { id: body.id } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "CARD_NOT_FOUND" });
          return;
        }

        await prisma.$transaction([
          prisma.transaction.deleteMany({
            where: {
              householdId: authHouseholdId,
              creditCardId: existing.id,
            },
          }),
          prisma.scheduledInstance.deleteMany({
            where: {
              householdId: authHouseholdId,
              creditCardId: existing.id,
            },
          }),
          prisma.installmentPlan.deleteMany({
            where: {
              householdId: authHouseholdId,
              creditCardId: existing.id,
            },
          }),
          prisma.recurringRule.deleteMany({
            where: {
              householdId: authHouseholdId,
              creditCardId: existing.id,
            },
          }),
          prisma.invoiceSettlement.deleteMany({
            where: {
              householdId: authHouseholdId,
              cardId: existing.id,
            },
          }),
          prisma.creditCard.delete({
            where: { id: existing.id },
          }),
        ]);

        sendJson(res, 200, { deleted: true });
        return;
      }

      if (req.method === "GET" && path === "/api/categories") {
        const householdId = authHouseholdId;
        const rows = await prisma.category.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        sendJson(res, 200, rows);
        return;
      }

      if (req.method === "POST" && path === "/api/categories") {
        const body = await readJsonBody(req);
        const created = await prisma.category.create({
          data: { householdId: authHouseholdId, name: body.name.trim(), normalized: normalizeName(body.name) },
        });
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "GET" && path === "/api/goals") {
        const rows = await prisma.goal.findMany({
          where: { householdId: authHouseholdId },
          orderBy: { createdAt: "desc" },
        });
        sendJson(res, 200, rows.map(toGoalDto));
        return;
      }

      if (req.method === "POST" && path === "/api/goals") {
        const body = await readJsonBody(req);
        const title = String(body.title ?? "").trim();
        const description = String(body.description ?? "").trim();
        if (title.length < 3 || title.length > 120 || description.length < 3 || description.length > 1000 || !isGoalType(body.type)) {
          sendJson(res, 400, { message: "GOAL_INVALID_INPUT" });
          return;
        }

        let targetDate: Date | null = null;
        let metricInput: { metricType: "PERCENTAGE" | "QUANTITY" | "OCCURRENCE"; metricValue: number; metricTarget: number | null };
        try {
          targetDate = normalizeGoalDate(body.targetDate);
          metricInput = normalizeGoalMetricInput({
            metricType: body.metricType,
            metricValue: body.metricValue,
            metricTarget: body.metricTarget,
          });
        } catch {
          sendJson(res, 400, { message: "GOAL_INVALID_INPUT" });
          return;
        }

        const created = await prisma.goal.create({
          data: {
            householdId: authHouseholdId,
            title,
            description,
            type: body.type,
            targetDate,
            metricType: metricInput.metricType,
            metricValue: metricInput.metricValue,
            metricTarget: metricInput.metricTarget,
          },
        });

        sendJson(res, 200, toGoalDto(created));
        return;
      }

      if (req.method === "POST" && path === "/api/goals/edit") {
        const body = await readJsonBody(req);
        const existing = await prisma.goal.findUnique({ where: { id: body.id } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "GOAL_NOT_FOUND" });
          return;
        }

        const title = String(body.title ?? "").trim();
        const description = String(body.description ?? "").trim();
        if (title.length < 3 || title.length > 120 || description.length < 3 || description.length > 1000 || !isGoalType(body.type)) {
          sendJson(res, 400, { message: "GOAL_INVALID_INPUT" });
          return;
        }

        let targetDate: Date | null = null;
        let metricInput: { metricType: "PERCENTAGE" | "QUANTITY" | "OCCURRENCE"; metricValue: number; metricTarget: number | null };
        try {
          targetDate = normalizeGoalDate(body.targetDate);
          metricInput = normalizeGoalMetricInput({
            metricType: body.metricType,
            metricValue: body.metricValue,
            metricTarget: body.metricTarget,
          });
        } catch {
          sendJson(res, 400, { message: "GOAL_INVALID_INPUT" });
          return;
        }

        const updated = await prisma.goal.update({
          where: { id: body.id },
          data: {
            title,
            description,
            type: body.type,
            targetDate,
            metricType: metricInput.metricType,
            metricValue: metricInput.metricValue,
            metricTarget: metricInput.metricTarget,
          },
        });

        sendJson(res, 200, toGoalDto(updated));
        return;
      }

      if (req.method === "GET" && path === "/api/transactions") {
        const householdId = authHouseholdId;
        const month = url.searchParams.get("month") ?? "";
        const accountId = url.searchParams.get("accountId");
        const creditCardId = url.searchParams.get("creditCardId");
        const categoryId = url.searchParams.get("categoryId");

        const start = new Date(`${month}-01T00:00:00.000Z`);
        const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));

        const rows = await prisma.transaction.findMany({
          where: {
            householdId,
            occurredAt: { gte: start, lt: end },
            ...(accountId ? { accountId } : {}),
            ...(creditCardId ? { creditCardId } : {}),
            ...(categoryId ? { categoryId } : {}),
          },
          orderBy: { occurredAt: "desc" },
        });

        sendJson(res, 200, rows.map(toTransactionDto));
        return;
      }

      if (req.method === "POST" && path === "/api/transactions") {
        const body = await readJsonBody(req);
        const invoiceFields = await resolveInvoiceFieldsForTransaction({
          householdId: authHouseholdId,
          kind: body.kind,
          occurredAt: body.occurredAt,
          creditCardId: body.creditCardId ?? null,
        });
        const created = await prisma.transaction.create({
          data: {
            householdId: authHouseholdId,
            kind: body.kind,
            description: body.description,
            amount: body.amount,
            occurredAt: new Date(body.occurredAt),
            accountId: body.accountId ?? null,
            creditCardId: body.creditCardId ?? null,
            categoryId: body.categoryId,
            invoiceMonthKey: invoiceFields.invoiceMonthKey,
            invoiceDueDate: invoiceFields.invoiceDueDate,
            settlementStatus: body.accountId ? body.settlementStatus ?? "PAID" : null,
            transferGroupId: null,
          },
        });

        sendJson(res, 200, toTransactionDto(created));
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/edit") {
        const body = await readJsonBody(req);
        const existing = await prisma.transaction.findUnique({ where: { id: body.id } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "TRANSACTION_NOT_FOUND" });
          return;
        }
        if (existing.transferGroupId) {
          sendJson(res, 400, { message: "INVESTMENT_TRANSFER_REQUIRES_GROUP_UPDATE" });
          return;
        }
        const invoiceFields = await resolveInvoiceFieldsForTransaction({
          householdId: authHouseholdId,
          kind: body.kind,
          occurredAt: body.occurredAt,
          creditCardId: body.creditCardId ?? null,
        });
        const updated = await prisma.transaction.update({
          where: { id: body.id },
          data: {
            kind: body.kind,
            description: body.description,
            amount: body.amount,
            occurredAt: new Date(body.occurredAt),
            accountId: body.accountId ?? null,
            creditCardId: body.creditCardId ?? null,
            categoryId: body.categoryId,
            invoiceMonthKey: invoiceFields.invoiceMonthKey,
            invoiceDueDate: invoiceFields.invoiceDueDate,
            settlementStatus: body.accountId ? body.settlementStatus ?? "PAID" : null,
          },
        });

        sendJson(res, 200, toTransactionDto(updated));
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/delete") {
        const body = await readJsonBody(req);
        const existing = await prisma.transaction.findUnique({ where: { id: body.id } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "TRANSACTION_NOT_FOUND" });
          return;
        }
        if (existing.transferGroupId) {
          await prisma.transaction.deleteMany({
            where: {
              householdId: authHouseholdId,
              transferGroupId: existing.transferGroupId,
            },
          });
          sendJson(res, 200, { deleted: true });
          return;
        }
        await prisma.transaction.delete({ where: { id: body.id } });
        sendJson(res, 200, { deleted: true });
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/investments") {
        const body = await readJsonBody(req);
        const created = await createInvestmentTransfer(body, authHouseholdId);
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/investments/edit") {
        const body = await readJsonBody(req);
        const pair = await prisma.transaction.findMany({
          where: {
            householdId: authHouseholdId,
            transferGroupId: body.transferGroupId,
          },
          orderBy: { createdAt: "asc" },
        });

        if (pair.length !== 2) {
          sendJson(res, 404, { message: "INVESTMENT_TRANSFER_NOT_FOUND" });
          return;
        }

        const source = await prisma.account.findUnique({ where: { id: body.sourceAccountId } });
        const destination = await prisma.account.findUnique({ where: { id: body.destinationAccountId } });
        const category = await prisma.category.findUnique({ where: { id: body.categoryId } });

        if (!source || source.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }
        if (!destination || destination.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }
        if (!category || category.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "CATEGORY_NOT_FOUND" });
          return;
        }
        if (source.id === destination.id) {
          sendJson(res, 400, { message: "INVESTMENT_TRANSFER_REQUIRES_DISTINCT_ACCOUNTS" });
          return;
        }
        assertInvestmentTypes(source, destination);

        const debit = pair.find((item) => item.kind === "EXPENSE");
        const credit = pair.find((item) => item.kind === "INCOME");
        if (!debit || !credit) {
          sendJson(res, 400, { message: "INVESTMENT_TRANSFER_BROKEN" });
          return;
        }

        const [updatedDebit, updatedCredit] = await prisma.$transaction([
          prisma.transaction.update({
            where: { id: debit.id },
            data: {
              kind: "EXPENSE",
              description: body.description,
              amount: body.amount,
              occurredAt: new Date(body.occurredAt),
              accountId: source.id,
              creditCardId: null,
              categoryId: body.categoryId,
              invoiceMonthKey: null,
              invoiceDueDate: null,
              settlementStatus: "PAID",
            },
          }),
          prisma.transaction.update({
            where: { id: credit.id },
            data: {
              kind: "INCOME",
              description: body.description,
              amount: body.amount,
              occurredAt: new Date(body.occurredAt),
              accountId: destination.id,
              creditCardId: null,
              categoryId: body.categoryId,
              invoiceMonthKey: null,
              invoiceDueDate: null,
              settlementStatus: "PAID",
            },
          }),
        ]);

        sendJson(res, 200, { transferGroupId: body.transferGroupId, debit: toTransactionDto(updatedDebit), credit: toTransactionDto(updatedCredit) });
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/investments/delete") {
        const body = await readJsonBody(req);
        const pair = await prisma.transaction.findMany({
          where: {
            householdId: authHouseholdId,
            transferGroupId: body.transferGroupId,
          },
        });
        if (pair.length !== 2) {
          sendJson(res, 404, { message: "INVESTMENT_TRANSFER_NOT_FOUND" });
          return;
        }
        await prisma.transaction.deleteMany({
          where: {
            householdId: authHouseholdId,
            transferGroupId: body.transferGroupId,
          },
        });
        sendJson(res, 200, { deleted: true });
        return;
      }

      const createLaunchByType = async (body: any) => {
        if (body.launchType === "ONE_OFF") {
          const transaction = body.transaction ?? {};
          const invoiceFields = await resolveInvoiceFieldsForTransaction({
            householdId: authHouseholdId,
            kind: transaction.kind,
            occurredAt: transaction.occurredAt,
            creditCardId: transaction.creditCardId ?? null,
          });
          const created = await prisma.transaction.create({
            data: {
              householdId: authHouseholdId,
              kind: transaction.kind,
              description: transaction.description,
              amount: transaction.amount,
              occurredAt: new Date(transaction.occurredAt),
              accountId: transaction.accountId ?? null,
              creditCardId: transaction.creditCardId ?? null,
              categoryId: transaction.categoryId,
              invoiceMonthKey: invoiceFields.invoiceMonthKey,
              invoiceDueDate: invoiceFields.invoiceDueDate,
              settlementStatus: transaction.accountId ? transaction.settlementStatus ?? "PAID" : null,
              transferGroupId: null,
            },
          });
          return toTransactionDto(created);
        }

        if (body.launchType === "INVESTMENT") {
          const investment = body.investment ?? {};
          return createInvestmentTransfer(investment, authHouseholdId);
        }

        if (body.launchType === "RECURRING") {
          const recurring = body.recurring ?? {};
          const created = await prisma.recurringRule.create({
            data: {
              householdId: authHouseholdId,
              kind: recurring.kind,
              description: recurring.description,
              amount: recurring.amount,
              startMonth: recurring.startMonth,
              categoryId: recurring.categoryId,
              accountId: recurring.accountId ?? null,
              creditCardId: recurring.creditCardId ?? null,
              active: true,
              revisionOfRuleId: null,
            },
          });
          await createRecurringInstances({
            householdId: authHouseholdId,
            sourceId: created.id,
            startMonth: recurring.startMonth,
            endMonth: addMonths(recurring.startMonth, 11),
            kind: recurring.kind,
            description: recurring.description,
            amount: recurring.amount,
            categoryId: recurring.categoryId,
            accountId: recurring.accountId ?? null,
            creditCardId: recurring.creditCardId ?? null,
          });
          return { ...created, amount: created.amount.toString() };
        }

        if (body.launchType === "INSTALLMENT") {
          const installment = body.installment ?? {};
          const created = await prisma.installmentPlan.create({
            data: {
              householdId: authHouseholdId,
              description: installment.description,
              totalAmount: installment.totalAmount,
              installmentsCount: installment.installmentsCount,
              startMonth: installment.startMonth,
              categoryId: installment.categoryId,
              accountId: installment.accountId ?? null,
              creditCardId: installment.creditCardId ?? null,
              active: true,
            },
          });
          await createInstallmentInstances({
            householdId: authHouseholdId,
            sourceId: created.id,
            startMonth: installment.startMonth,
            description: installment.description,
            totalAmount: installment.totalAmount,
            installmentsCount: installment.installmentsCount,
            categoryId: installment.categoryId,
            accountId: installment.accountId ?? null,
            creditCardId: installment.creditCardId ?? null,
          });
          return { ...created, totalAmount: created.totalAmount.toString() };
        }

        throw new Error("LAUNCH_TYPE_NOT_SUPPORTED");
      };

      if (req.method === "POST" && path === "/api/launches") {
        const body = await readJsonBody(req);
        const created = await createLaunchByType(body);
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "POST" && path === "/api/launches/batch") {
        const body = await readJsonBody(req);
        const entries = Array.isArray(body?.entries) ? body.entries : [];

        let created = 0;
        const errors: Array<{ index: number; error: string }> = [];

        for (let index = 0; index < entries.length; index += 1) {
          try {
            await createLaunchByType(entries[index]);
            created += 1;
          } catch (error: any) {
            errors.push({ index, error: error?.message ?? "UNKNOWN_ERROR" });
          }
        }

        sendJson(res, 200, {
          total: entries.length,
          created,
          failed: entries.length - created,
          errors,
        });
        return;
      }

      if (req.method === "GET" && path === "/api/invoices/card") {
        const householdId = authHouseholdId;
        const cardId = url.searchParams.get("cardId") ?? "";
        const referenceDate = url.searchParams.get("referenceDate") ?? new Date().toISOString();
        const { invoicesService } = await loadServices();
        sendJson(res, 200, invoicesService.getCardCurrentAndNext({ householdId, cardId, referenceDate }));
        return;
      }

      if (req.method === "GET" && path === "/api/invoices/due") {
        const householdId = authHouseholdId;
        const dueMonth = url.searchParams.get("dueMonth") ?? "";
        const { invoicesService } = await loadServices();
        sendJson(res, 200, invoicesService.getDueObligationsByMonth({ householdId, dueMonth }));
        return;
      }

      if (req.method === "GET" && path === "/api/invoices/monthly") {
        const householdId = authHouseholdId;
        const month = url.searchParams.get("month") ?? "";
        const { invoicesService } = await loadServices();
        sendJson(res, 200, invoicesService.getMonthlyInvoices({ householdId, month }));
        return;
      }

      if (req.method === "GET" && path === "/api/invoices/items") {
        const householdId = authHouseholdId;
        const cardId = url.searchParams.get("cardId") ?? "";
        const dueMonth = url.searchParams.get("dueMonth") ?? "";
        const { invoicesService } = await loadServices();
        sendJson(res, 200, invoicesService.getCardInvoiceEntriesByDueMonth({ householdId, cardId, dueMonth }));
        return;
      }

      if (req.method === "POST" && path === "/api/invoices/adjustment") {
        const householdId = authHouseholdId;
        const body = await readJsonBody(req);
        const cardId = String(body.cardId ?? "");
        const dueMonth = String(body.dueMonth ?? "");

        const card = await prisma.creditCard.findUnique({ where: { id: cardId } });
        if (!card || card.householdId !== householdId) {
          sendJson(res, 404, { message: "CARD_NOT_FOUND" });
          return;
        }

        const { invoicesService } = await loadServices();
        const invoice = invoicesService.getCardInvoiceEntriesByDueMonth({ householdId, cardId, dueMonth });
        const previousInvoiceTotal = new Decimal(invoice.total);
        const realInvoiceTotal = new Decimal(String(body.realInvoiceTotal));
        const difference = realInvoiceTotal.minus(previousInvoiceTotal);
        const normalized = normalizeName("Reajuste");
        const category = await prisma.category.upsert({
          where: {
            householdId_normalized: {
              householdId,
              normalized,
            },
          },
          create: {
            householdId,
            name: "Reajuste",
            normalized,
          },
          update: {},
        });

        const transaction = await prisma.transaction.create({
          data: {
            householdId,
            kind: "EXPENSE",
            description: "REAJUSTE",
            amount: difference.toFixed(2),
            occurredAt: new Date(body.occurredAt),
            accountId: null,
            creditCardId: card.id,
            categoryId: category.id,
            invoiceMonthKey: dueMonth,
            invoiceDueDate: new Date(invoice.dueDate),
            settlementStatus: null,
            transferGroupId: null,
          },
        });

        sendJson(res, 200, {
          previousInvoiceTotal: previousInvoiceTotal.toFixed(2),
          realInvoiceTotal: realInvoiceTotal.toFixed(2),
          difference: difference.toFixed(2),
          transaction: toTransactionDto(transaction),
        });
        return;
      }

      if (req.method === "POST" && path === "/api/invoices/settle") {
        const householdId = authHouseholdId;
        const body = await readJsonBody(req);
        const cardId = String(body.cardId ?? "");
        const dueMonth = String(body.dueMonth ?? "");
        const paymentAccountId = String(body.paymentAccountId ?? "");

        const card = await prisma.creditCard.findUnique({ where: { id: cardId } });
        const account = await prisma.account.findUnique({ where: { id: paymentAccountId } });
        if (!card || card.householdId !== householdId) {
          sendJson(res, 404, { message: "CARD_NOT_FOUND" });
          return;
        }
        if (!account || account.householdId !== householdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }

        const { invoicesService } = await loadServices();
        const monthly = invoicesService.getMonthlyInvoices({ householdId, month: dueMonth });
        const invoice = monthly.cards.find((item: any) => item.cardId === cardId);
        if (!invoice) {
          sendJson(res, 404, { message: "INVOICE_NOT_FOUND" });
          return;
        }

        const paidAtIso = body.paidAt ? new Date(body.paidAt).toISOString() : new Date().toISOString();
        await prisma.invoiceSettlement.upsert({
          where: {
            householdId_cardId_dueMonth: {
              householdId,
              cardId,
              dueMonth,
            },
          },
          create: {
            householdId,
            cardId,
            dueMonth,
            paymentAccountId,
            paidAt: new Date(paidAtIso),
            paidAmount: invoice.total,
          },
          update: {
            paymentAccountId,
            paidAt: new Date(paidAtIso),
            paidAmount: invoice.total,
          },
        });

        sendJson(res, 200, { settled: true });
        return;
      }

      if (req.method === "POST" && path === "/api/invoices/unsettle") {
        const householdId = authHouseholdId;
        const body = await readJsonBody(req);
        const cardId = String(body.cardId ?? "");
        const dueMonth = String(body.dueMonth ?? "");

        await prisma.invoiceSettlement.deleteMany({
          where: {
            householdId,
            cardId,
            dueMonth,
          },
        });

        sendJson(res, 200, { settled: false });
        return;
      }

      if (req.method === "GET" && path === "/api/free-balance") {
        const householdId = authHouseholdId;
        const month = url.searchParams.get("month") ?? "";
        const { freeBalanceService } = await loadServices();
        sendJson(res, 200, freeBalanceService.getFreeBalance({ householdId, month }));
        return;
      }

      if (req.method === "GET" && path === "/api/schedules") {
        const householdId = authHouseholdId;
        const installments = await prisma.installmentPlan.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        const recurrences = await prisma.recurringRule.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        const instances = await prisma.scheduledInstance.findMany({ where: { householdId }, orderBy: [{ monthKey: "asc" }, { sequence: "asc" }] });
        sendJson(res, 200, {
          installments: installments.map((item) => ({ ...item, totalAmount: item.totalAmount.toString() })),
          recurrences: recurrences.map((item) => ({ ...item, amount: item.amount.toString() })),
          instances: instances.map((item) => ({ ...item, amount: item.amount.toString(), occurredAt: item.occurredAt.toISOString() })),
        });
        return;
      }

      if (req.method === "GET" && path === "/api/schedules/instances") {
        const householdId = authHouseholdId;
        const month = url.searchParams.get("month") ?? "";
        const instances = await prisma.scheduledInstance.findMany({
          where: { householdId, monthKey: month },
          orderBy: [{ monthKey: "asc" }, { sequence: "asc" }],
        });
        sendJson(res, 200, instances.map((item) => ({ ...item, amount: item.amount.toString(), occurredAt: item.occurredAt.toISOString() })));
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/instances/settlement") {
        const body = await readJsonBody(req);
        const existing = await prisma.scheduledInstance.findUnique({ where: { id: body.instanceId } });
        if (!existing || existing.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "SCHEDULE_INSTANCE_NOT_FOUND" });
          return;
        }
        if (!existing.accountId) {
          sendJson(res, 400, { message: "SCHEDULE_INSTANCE_REQUIRES_ACCOUNT" });
          return;
        }
        if (body.settlementStatus !== "PAID" && body.settlementStatus !== "UNPAID") {
          sendJson(res, 400, { message: "INVALID_SETTLEMENT_STATUS" });
          return;
        }

        const updated = await prisma.scheduledInstance.update({
          where: { id: existing.id },
          data: { settlementStatus: body.settlementStatus },
        });
        sendJson(res, 200, { ...updated, amount: updated.amount.toString(), occurredAt: updated.occurredAt.toISOString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/installment") {
        const body = await readJsonBody(req);
        const created = await prisma.installmentPlan.create({
          data: {
            householdId: authHouseholdId,
            description: body.description,
            totalAmount: body.totalAmount,
            installmentsCount: body.installmentsCount,
            startMonth: body.startMonth,
            categoryId: body.categoryId,
            accountId: body.accountId ?? null,
            creditCardId: body.creditCardId ?? null,
            active: true,
          },
        });
        await createInstallmentInstances({
          householdId: created.householdId,
          sourceId: created.id,
          startMonth: created.startMonth,
          description: created.description,
          totalAmount: created.totalAmount.toString(),
          installmentsCount: created.installmentsCount,
          categoryId: created.categoryId,
          accountId: created.accountId,
          creditCardId: created.creditCardId,
        });
        sendJson(res, 200, { ...created, totalAmount: created.totalAmount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring") {
        const body = await readJsonBody(req);
        const created = await prisma.recurringRule.create({
          data: {
            householdId: authHouseholdId,
            kind: body.kind,
            description: body.description,
            amount: body.amount,
            startMonth: body.startMonth,
            categoryId: body.categoryId,
            accountId: body.accountId ?? null,
            creditCardId: body.creditCardId ?? null,
            active: true,
            revisionOfRuleId: null,
          },
        });
        await createRecurringInstances({
          householdId: created.householdId,
          sourceId: created.id,
          startMonth: created.startMonth,
          endMonth: addMonths(created.startMonth, 11),
          kind: created.kind,
          description: created.description,
          amount: created.amount.toString(),
          categoryId: created.categoryId,
          accountId: created.accountId,
          creditCardId: created.creditCardId,
        });
        sendJson(res, 200, { ...created, amount: created.amount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring/edit") {
        const body = await readJsonBody(req);
        const original = await prisma.recurringRule.findUnique({ where: { id: body.ruleId } });
        if (!original || original.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "RECURRING_RULE_NOT_FOUND" });
          return;
        }

        if (body.scope === "THIS_ONLY") {
          const instance = await prisma.scheduledInstance.findFirst({
            where: {
              sourceType: "RECURRING",
              sourceId: original.id,
              monthKey: body.effectiveMonth,
            },
          });
          if (!instance || instance.householdId !== authHouseholdId) {
            sendJson(res, 404, { message: "RECURRING_INSTANCE_NOT_FOUND" });
            return;
          }

          const updated = await prisma.scheduledInstance.update({
            where: { id: instance.id },
            data: {
              kind: body.kind ?? instance.kind,
              description: body.description ?? instance.description,
              amount: body.amount ?? instance.amount,
            },
          });

          sendJson(res, 200, { ...updated, amount: updated.amount.toString() });
          return;
        }

        await prisma.scheduledInstance.updateMany({
          where: {
            sourceType: "RECURRING",
            sourceId: original.id,
            monthKey: { lt: body.effectiveMonth },
          },
          data: { locked: true },
        });

        await prisma.scheduledInstance.deleteMany({
          where: {
            sourceType: "RECURRING",
            sourceId: original.id,
            monthKey: { gte: body.effectiveMonth },
          },
        });

        await prisma.recurringRule.update({
          where: { id: original.id },
          data: { active: false },
        });

        const revised = await prisma.recurringRule.create({
          data: {
            householdId: original.householdId,
            kind: body.kind ?? original.kind,
            description: body.description ?? original.description,
            amount: body.amount ?? original.amount.toString(),
            startMonth: body.effectiveMonth,
            categoryId: original.categoryId,
            accountId: original.accountId,
            creditCardId: original.creditCardId,
            active: true,
            revisionOfRuleId: original.id,
          },
        });

        await createRecurringInstances({
          householdId: revised.householdId,
          sourceId: revised.id,
          startMonth: body.effectiveMonth,
          endMonth: addMonths(body.effectiveMonth, 11),
          kind: revised.kind,
          description: revised.description,
          amount: revised.amount.toString(),
          categoryId: revised.categoryId,
          accountId: revised.accountId,
          creditCardId: revised.creditCardId,
        });

        sendJson(res, 200, { ...revised, amount: revised.amount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring/delete") {
        const body = await readJsonBody(req);
        const original = await prisma.recurringRule.findUnique({ where: { id: body.ruleId } });
        if (!original || original.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "RECURRING_RULE_NOT_FOUND" });
          return;
        }

        if (body.scope === "ALL") {
          const householdRules = await prisma.recurringRule.findMany({
            where: { householdId: authHouseholdId },
            select: { id: true, revisionOfRuleId: true },
          });
          const lineage = new Set<string>([original.id]);
          let changed = true;
          while (changed) {
            changed = false;
            for (const currentId of Array.from(lineage)) {
              const current = householdRules.find((item) => item.id === currentId);
              if (current?.revisionOfRuleId && !lineage.has(current.revisionOfRuleId)) {
                lineage.add(current.revisionOfRuleId);
                changed = true;
              }
              for (const candidate of householdRules) {
                if (candidate.revisionOfRuleId === currentId && !lineage.has(candidate.id)) {
                  lineage.add(candidate.id);
                  changed = true;
                }
              }
            }
          }
          const recurringRuleIds = Array.from(lineage);
          await prisma.scheduledInstance.deleteMany({
            where: {
              sourceType: "RECURRING",
              sourceId: { in: recurringRuleIds },
            },
          });
          await prisma.recurringRule.deleteMany({
            where: { id: { in: recurringRuleIds } },
          });
          sendJson(res, 200, { deleted: true, scope: "ALL" });
          return;
        }

        await prisma.scheduledInstance.updateMany({
          where: {
            sourceType: "RECURRING",
            sourceId: original.id,
            monthKey: { lt: body.fromMonth },
          },
          data: { locked: true },
        });

        await prisma.scheduledInstance.deleteMany({
          where: {
            sourceType: "RECURRING",
            sourceId: original.id,
            monthKey: { gte: body.fromMonth },
          },
        });

        await prisma.recurringRule.update({
          where: { id: original.id },
          data: { active: false },
        });

        sendJson(res, 200, { deleted: true, scope: "CURRENT_AND_FUTURE" });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/installment/edit") {
        const body = await readJsonBody(req);
        const plan = await prisma.installmentPlan.findUnique({ where: { id: body.planId } });
        if (!plan || plan.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "INSTALLMENT_PLAN_NOT_FOUND" });
          return;
        }

        const instances = await prisma.scheduledInstance.findMany({
          where: {
            sourceType: "INSTALLMENT",
            sourceId: plan.id,
            monthKey: { gte: body.effectiveMonth },
            locked: false,
          },
          orderBy: { sequence: "asc" },
        });

        for (const instance of instances) {
          await prisma.scheduledInstance.update({
            where: { id: instance.id },
            data: {
              kind: body.kind ?? instance.kind,
              amount: body.amount ?? instance.amount.toString(),
              description: body.description ? `${body.description} (${instance.sequence}/${plan.installmentsCount})` : instance.description,
            },
          });
        }

        const allInstances = await prisma.scheduledInstance.findMany({
          where: { sourceType: "INSTALLMENT", sourceId: plan.id },
        });
        const recomputedTotal = allInstances.reduce((acc, item) => acc + Number(item.amount.toString()), 0).toFixed(2);

        const updated = await prisma.installmentPlan.update({
          where: { id: plan.id },
          data: {
            ...(body.description ? { description: body.description } : {}),
            ...(body.amount ? { totalAmount: recomputedTotal } : {}),
          },
        });

        sendJson(res, 200, { ...updated, totalAmount: updated.totalAmount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/installment/delete") {
        const body = await readJsonBody(req);
        const plan = await prisma.installmentPlan.findUnique({ where: { id: body.planId } });
        if (!plan || plan.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "INSTALLMENT_PLAN_NOT_FOUND" });
          return;
        }

        if (body.scope === "ALL") {
          await prisma.scheduledInstance.deleteMany({
            where: {
              sourceType: "INSTALLMENT",
              sourceId: plan.id,
            },
          });
          await prisma.installmentPlan.delete({ where: { id: plan.id } });
          sendJson(res, 200, { deleted: true, scope: "ALL" });
          return;
        }

        await prisma.scheduledInstance.updateMany({
          where: {
            sourceType: "INSTALLMENT",
            sourceId: plan.id,
            monthKey: { lt: body.fromMonth },
          },
          data: { locked: true },
        });

        await prisma.scheduledInstance.deleteMany({
          where: {
            sourceType: "INSTALLMENT",
            sourceId: plan.id,
            monthKey: { gte: body.fromMonth },
          },
        });

        await prisma.installmentPlan.update({
          where: { id: plan.id },
          data: { active: false },
        });

        sendJson(res, 200, { deleted: true, scope: "CURRENT_AND_FUTURE" });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring/stop") {
        const body = await readJsonBody(req);
        const original = await prisma.recurringRule.findUnique({ where: { id: body.ruleId } });
        if (!original || original.householdId !== authHouseholdId) {
          sendJson(res, 404, { message: "RECURRING_RULE_NOT_FOUND" });
          return;
        }

        await prisma.scheduledInstance.updateMany({
          where: {
            sourceType: "RECURRING",
            sourceId: original.id,
            monthKey: { lt: body.stopFromMonth },
          },
          data: { locked: true },
        });

        await prisma.scheduledInstance.deleteMany({
          where: {
            sourceType: "RECURRING",
            sourceId: original.id,
            monthKey: { gte: body.stopFromMonth },
          },
        });

        const updated = await prisma.recurringRule.update({
          where: { id: body.ruleId },
          data: { active: false },
        });
        sendJson(res, 200, { ...updated, amount: updated.amount.toString() });
        return;
      }

      sendJson(res, 404, { message: "API_ROUTE_NOT_FOUND" });
    } catch (error: any) {
      const message = error?.message ?? "PERSISTENCE_ERROR";
      const status = message === "ACCOUNT_GOAL_ONLY_FOR_INVESTMENT" || message === "ACCOUNT_GOAL_INVALID" ? 400 : 500;
      sendJson(res, status, { message });
    }
  });
}
