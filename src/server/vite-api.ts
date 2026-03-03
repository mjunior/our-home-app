import type { ViteDevServer } from "vite";
import { InvoiceCycleService } from "../modules/invoices/invoice-cycle.service";
import { InvoicesService } from "../modules/invoices/invoices.service";
import { FreeBalancePolicy } from "../modules/free-balance/free-balance.policy";
import { FreeBalanceService } from "../modules/free-balance/free-balance.service";
import { prisma } from "../modules/shared/persistence/prisma";

class AccountsReadRepository {
  constructor(private readonly rows: Array<{ id: string; householdId: string; name: string; type: "CHECKING" | "SAVINGS" | "CASH"; openingBalance: string }>) {}
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
  constructor(private readonly rows: Array<any>) {}
  listInstancesByHousehold(householdId: string) { return this.rows.filter((item) => item.householdId === householdId); }
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
  };
}

async function loadServices() {
  const accounts = await prisma.account.findMany();
  const cards = await prisma.creditCard.findMany();
  const transactions = await prisma.transaction.findMany();
  const instances = await prisma.scheduledInstance.findMany();

  const accountRepo = new AccountsReadRepository(accounts.map((item) => ({
    id: item.id,
    householdId: item.householdId,
    name: item.name,
    type: item.type,
    openingBalance: item.openingBalance.toString(),
  })));

  const cardRepo = new CardsReadRepository(cards.map((item) => ({
    id: item.id,
    householdId: item.householdId,
    name: item.name,
    closeDay: item.closeDay,
    dueDay: item.dueDay,
  })));

  const transactionRepo = new TransactionsReadRepository(transactions.map(toTransactionDto));
  const scheduleRepo = new ScheduleReadRepository(instances.map((item) => ({
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
  })));

  const cycleService = new InvoiceCycleService();

  return {
    invoicesService: new InvoicesService(transactionRepo as any, cardRepo as any, cycleService),
    freeBalanceService: new FreeBalanceService(
      accountRepo as any,
      cardRepo as any,
      transactionRepo as any,
      scheduleRepo as any,
      cycleService,
      new FreeBalancePolicy(),
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

  const defaults = ["Moradia", "Alimentacao", "Transporte", "Saude", "Lazer"];
  for (const category of defaults) {
    const normalized = normalizeName(category);
    const exists = await prisma.category.findFirst({ where: { householdId, normalized } });
    if (!exists) {
      await prisma.category.create({ data: { householdId, name: category, normalized } });
    }
  }
}

export function installViteApi(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }

    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;

      if (req.method === "GET" && path === "/api/accounts") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const rows = await prisma.account.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        sendJson(res, 200, rows.map((item) => ({ ...item, openingBalance: item.openingBalance.toString() })));
        return;
      }

      if (req.method === "POST" && path === "/api/accounts") {
        const body = await readJsonBody(req);
        const created = await prisma.account.create({
          data: {
            householdId: body.householdId,
            name: body.name,
            type: body.type,
            openingBalance: body.openingBalance,
          },
        });
        await ensureBootstrap(body.householdId);
        sendJson(res, 200, { ...created, openingBalance: created.openingBalance.toString() });
        return;
      }

      if (req.method === "GET" && path === "/api/accounts/consolidated") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const rows = await prisma.account.findMany({ where: { householdId } });
        const total = rows.reduce((acc, item) => acc + Number(item.openingBalance.toString()), 0);
        sendJson(res, 200, { amount: total.toFixed(2) });
        return;
      }

      if (req.method === "GET" && path === "/api/cards") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const rows = await prisma.creditCard.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        sendJson(res, 200, rows);
        return;
      }

      if (req.method === "POST" && path === "/api/cards") {
        const body = await readJsonBody(req);
        const created = await prisma.creditCard.create({ data: body });
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "GET" && path === "/api/categories") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const rows = await prisma.category.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
        sendJson(res, 200, rows);
        return;
      }

      if (req.method === "POST" && path === "/api/categories") {
        const body = await readJsonBody(req);
        const created = await prisma.category.create({
          data: { householdId: body.householdId, name: body.name.trim(), normalized: normalizeName(body.name) },
        });
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "GET" && path === "/api/transactions") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
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
        const created = await prisma.transaction.create({
          data: {
            householdId: body.householdId,
            kind: body.kind,
            description: body.description,
            amount: body.amount,
            occurredAt: new Date(body.occurredAt),
            accountId: body.accountId ?? null,
            creditCardId: body.creditCardId ?? null,
            categoryId: body.categoryId,
            invoiceMonthKey: null,
            invoiceDueDate: null,
          },
        });

        sendJson(res, 200, toTransactionDto(created));
        return;
      }

      if (req.method === "GET" && path === "/api/invoices/card") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const cardId = url.searchParams.get("cardId") ?? "";
        const referenceDate = url.searchParams.get("referenceDate") ?? new Date().toISOString();
        const { invoicesService } = await loadServices();
        sendJson(res, 200, invoicesService.getCardCurrentAndNext({ householdId, cardId, referenceDate }));
        return;
      }

      if (req.method === "GET" && path === "/api/free-balance") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const month = url.searchParams.get("month") ?? "";
        const { freeBalanceService } = await loadServices();
        sendJson(res, 200, freeBalanceService.getFreeBalance({ householdId, month }));
        return;
      }

      if (req.method === "GET" && path === "/api/schedules") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
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

      if (req.method === "POST" && path === "/api/schedules/installment") {
        const body = await readJsonBody(req);
        const created = await prisma.installmentPlan.create({
          data: {
            householdId: body.householdId,
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
        sendJson(res, 200, { ...created, totalAmount: created.totalAmount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring") {
        const body = await readJsonBody(req);
        const created = await prisma.recurringRule.create({
          data: {
            householdId: body.householdId,
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
        sendJson(res, 200, { ...created, amount: created.amount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring/edit") {
        const body = await readJsonBody(req);
        const updated = await prisma.recurringRule.update({
          where: { id: body.ruleId },
          data: {
            ...(body.description ? { description: body.description } : {}),
            ...(body.amount ? { amount: body.amount } : {}),
          },
        });
        sendJson(res, 200, { ...updated, amount: updated.amount.toString() });
        return;
      }

      if (req.method === "POST" && path === "/api/schedules/recurring/stop") {
        const body = await readJsonBody(req);
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
      sendJson(res, 500, { message });
    }
  });
}
