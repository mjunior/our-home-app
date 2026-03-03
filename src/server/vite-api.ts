import type { ViteDevServer } from "vite";
import { InvoiceCycleService } from "../modules/invoices/invoice-cycle.service";
import { InvoicesService } from "../modules/invoices/invoices.service";
import { FreeBalancePolicy } from "../modules/free-balance/free-balance.policy";
import { FreeBalanceService } from "../modules/free-balance/free-balance.service";
import { prisma } from "../modules/shared/persistence/prisma";

class AccountsReadRepository {
  constructor(private readonly rows: Array<{ id: string; householdId: string; name: string; type: "CHECKING" | "INVESTMENT"; openingBalance: string }>) {}
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
    transferGroupId: row.transferGroupId ?? null,
  };
}

function assertInvestmentTypes(source: any, destination: any) {
  if (source.type !== "CHECKING") {
    throw new Error("INVESTMENT_SOURCE_MUST_BE_CHECKING");
  }
  if (destination.type !== "INVESTMENT") {
    throw new Error("INVESTMENT_DESTINATION_MUST_BE_INVESTMENT");
  }
}

async function createInvestmentTransfer(body: any) {
  const source = await prisma.account.findUnique({ where: { id: body.sourceAccountId } });
  const destination = await prisma.account.findUnique({ where: { id: body.destinationAccountId } });
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });

  if (!source || source.householdId !== body.householdId) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  if (!destination || destination.householdId !== body.householdId) {
    throw new Error("ACCOUNT_NOT_FOUND");
  }
  if (!category || category.householdId !== body.householdId) {
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
        householdId: body.householdId,
        kind: "EXPENSE",
        description: body.description,
        amount: body.amount,
        occurredAt: new Date(body.occurredAt),
        accountId: source.id,
        creditCardId: null,
        categoryId: body.categoryId,
        invoiceMonthKey: null,
        invoiceDueDate: null,
        transferGroupId,
      },
    }),
    prisma.transaction.create({
      data: {
        householdId: body.householdId,
        kind: "INCOME",
        description: body.description,
        amount: body.amount,
        occurredAt: new Date(body.occurredAt),
        accountId: destination.id,
        creditCardId: null,
        categoryId: body.categoryId,
        invoiceMonthKey: null,
        invoiceDueDate: null,
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
            transferGroupId: null,
          },
        });

        sendJson(res, 200, toTransactionDto(created));
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/edit") {
        const body = await readJsonBody(req);
        const existing = await prisma.transaction.findUnique({ where: { id: body.id } });
        if (!existing) {
          sendJson(res, 404, { message: "TRANSACTION_NOT_FOUND" });
          return;
        }
        if (existing.transferGroupId) {
          sendJson(res, 400, { message: "INVESTMENT_TRANSFER_REQUIRES_GROUP_UPDATE" });
          return;
        }
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
            invoiceMonthKey: null,
            invoiceDueDate: null,
          },
        });

        sendJson(res, 200, toTransactionDto(updated));
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/delete") {
        const body = await readJsonBody(req);
        const existing = await prisma.transaction.findUnique({ where: { id: body.id } });
        if (!existing) {
          sendJson(res, 404, { message: "TRANSACTION_NOT_FOUND" });
          return;
        }
        if (existing.transferGroupId) {
          await prisma.transaction.deleteMany({
            where: {
              householdId: body.householdId,
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
        const created = await createInvestmentTransfer(body);
        sendJson(res, 200, created);
        return;
      }

      if (req.method === "POST" && path === "/api/transactions/investments/edit") {
        const body = await readJsonBody(req);
        const pair = await prisma.transaction.findMany({
          where: {
            householdId: body.householdId,
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

        if (!source || source.householdId !== body.householdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }
        if (!destination || destination.householdId !== body.householdId) {
          sendJson(res, 404, { message: "ACCOUNT_NOT_FOUND" });
          return;
        }
        if (!category || category.householdId !== body.householdId) {
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
            householdId: body.householdId,
            transferGroupId: body.transferGroupId,
          },
        });
        if (pair.length !== 2) {
          sendJson(res, 404, { message: "INVESTMENT_TRANSFER_NOT_FOUND" });
          return;
        }
        await prisma.transaction.deleteMany({
          where: {
            householdId: body.householdId,
            transferGroupId: body.transferGroupId,
          },
        });
        sendJson(res, 200, { deleted: true });
        return;
      }

      if (req.method === "POST" && path === "/api/launches") {
        const body = await readJsonBody(req);

        if (body.launchType === "ONE_OFF") {
          const transaction = body.transaction ?? {};
          const created = await prisma.transaction.create({
            data: {
              householdId: transaction.householdId,
              kind: transaction.kind,
              description: transaction.description,
              amount: transaction.amount,
              occurredAt: new Date(transaction.occurredAt),
              accountId: transaction.accountId ?? null,
              creditCardId: transaction.creditCardId ?? null,
              categoryId: transaction.categoryId,
              invoiceMonthKey: null,
              invoiceDueDate: null,
              transferGroupId: null,
            },
          });
          sendJson(res, 200, toTransactionDto(created));
          return;
        }

        if (body.launchType === "INVESTMENT") {
          const investment = body.investment ?? {};
          const created = await createInvestmentTransfer(investment);
          sendJson(res, 200, created);
          return;
        }

        if (body.launchType === "RECURRING") {
          const recurring = body.recurring ?? {};
          const created = await prisma.recurringRule.create({
            data: {
              householdId: recurring.householdId,
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
            householdId: recurring.householdId,
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
          sendJson(res, 200, { ...created, amount: created.amount.toString() });
          return;
        }

        if (body.launchType === "INSTALLMENT") {
          const installment = body.installment ?? {};
          const created = await prisma.installmentPlan.create({
            data: {
              householdId: installment.householdId,
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
            householdId: installment.householdId,
            sourceId: created.id,
            startMonth: installment.startMonth,
            description: installment.description,
            totalAmount: installment.totalAmount,
            installmentsCount: installment.installmentsCount,
            categoryId: installment.categoryId,
            accountId: installment.accountId ?? null,
            creditCardId: installment.creditCardId ?? null,
          });
          sendJson(res, 200, { ...created, totalAmount: created.totalAmount.toString() });
          return;
        }
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

      if (req.method === "GET" && path === "/api/schedules/instances") {
        const householdId = url.searchParams.get("householdId") ?? "household-main";
        const month = url.searchParams.get("month") ?? "";
        const instances = await prisma.scheduledInstance.findMany({
          where: { householdId, monthKey: month },
          orderBy: [{ monthKey: "asc" }, { sequence: "asc" }],
        });
        sendJson(res, 200, instances.map((item) => ({ ...item, amount: item.amount.toString(), occurredAt: item.occurredAt.toISOString() })));
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
        if (!original) {
          sendJson(res, 404, { message: "RECURRING_RULE_NOT_FOUND" });
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
        if (!original) {
          sendJson(res, 404, { message: "RECURRING_RULE_NOT_FOUND" });
          return;
        }

        if (body.scope === "ALL") {
          await prisma.scheduledInstance.deleteMany({
            where: {
              sourceType: "RECURRING",
              sourceId: original.id,
            },
          });
          await prisma.recurringRule.delete({ where: { id: original.id } });
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
        if (!plan) {
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
        if (!plan) {
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
        if (!original) {
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
      sendJson(res, 500, { message });
    }
  });
}
