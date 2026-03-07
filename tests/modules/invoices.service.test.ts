import { beforeEach, describe, expect, it } from "vitest";

import { AccountsController } from "../../src/modules/accounts/accounts.controller";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { CardsController } from "../../src/modules/cards/cards.controller";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CardsService } from "../../src/modules/cards/cards.service";
import { CategoriesController } from "../../src/modules/categories/categories.controller";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { CategoriesService } from "../../src/modules/categories/categories.service";
import { InvoiceCycleService } from "../../src/modules/invoices/invoice-cycle.service";
import { InvoicesController } from "../../src/modules/invoices/invoices.controller";
import { InvoicesService } from "../../src/modules/invoices/invoices.service";
import { TransactionsController } from "../../src/modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const householdId = "household-main";

const accountsRepo = new AccountsRepository();
const cardsRepo = new CardsRepository();
const categoriesRepo = new CategoriesRepository();
const transactionsRepo = new TransactionsRepository();

const accounts = new AccountsController(new AccountsService(accountsRepo));
const cards = new CardsController(new CardsService(cardsRepo));
const categories = new CategoriesController(new CategoriesService(categoriesRepo));
const transactions = new TransactionsController(
  new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
);
const invoices = new InvoicesController(
  new InvoicesService(transactionsRepo, cardsRepo, new InvoiceCycleService()),
);

describe("invoice services", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
  });

  it("assigns purchases to current and next invoice based on close day", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const card = cards.createCard({ householdId, name: "Visa", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Mercado" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra antes do fechamento",
      amount: "200.00",
      occurredAt: "2026-03-04T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra apos fechamento",
      amount: "350.00",
      occurredAt: "2026-03-06T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "INCOME",
      description: "Salario",
      amount: "5000.00",
      occurredAt: "2026-03-01T10:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    const summary = invoices.getCardInvoices({
      householdId,
      cardId: card.id,
      referenceDate: "2026-03-03T10:00:00.000Z",
    });

    expect(summary.current.total).toBe("200.00");
    expect(summary.next.total).toBe("350.00");
  });

  it("treats close day as inclusive in invoice aggregation", () => {
    const card = cards.createCard({ householdId, name: "Visa Boundary", closeDay: 5, dueDay: 10 });
    const category = categories.createCategory({ householdId, name: "Compras" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Antes do fechamento",
      amount: "100.00",
      occurredAt: "2026-04-04T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "No fechamento",
      amount: "200.00",
      occurredAt: "2026-04-05T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const summary = invoices.getCardInvoices({
      householdId,
      cardId: card.id,
      referenceDate: "2026-04-05T10:00:00.000Z",
    });

    expect(summary.current.monthKey).toBe("2026-05");
    expect(summary.current.total).toBe("200.00");
    expect(summary.next.monthKey).toBe("2026-06");
    expect(summary.next.total).toBe("0.00");
  });

  it("returns monthly cashflow summary with card obligations", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta 2",
      type: "CHECKING",
      openingBalance: "200.00",
    });
    const card = cards.createCard({ householdId, name: "Master", closeDay: 8, dueDay: 15 });
    const category = categories.createCategory({ householdId, name: "Casa" });

    transactions.createTransaction({
      householdId,
      kind: "INCOME",
      description: "Renda",
      amount: "4000.00",
      occurredAt: "2026-03-01T10:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Despesa conta",
      amount: "500.00",
      occurredAt: "2026-03-02T10:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Despesa cartao",
      amount: "300.00",
      occurredAt: "2026-03-02T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const monthly = invoices.getMonthlyCashflowSummary({ householdId, month: "2026-03" });

    expect(monthly.totalIncome).toBe("4000.00");
    expect(monthly.totalExpense).toBe("800.00");
    expect(monthly.cardObligations).toBe("300.00");
  });

  it("aggregates due obligations by month without double counting account expenses", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta 3",
      type: "CHECKING",
      openingBalance: "1500.00",
    });
    const card = cards.createCard({ householdId, name: "Nubank", closeDay: 10, dueDay: 18 });
    const category = categories.createCategory({ householdId, name: "Casa" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra cartao 1",
      amount: "250.00",
      occurredAt: "2026-03-04T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });
    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra cartao 2",
      amount: "150.00",
      occurredAt: "2026-03-09T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });
    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Conta de agua",
      amount: "90.00",
      occurredAt: "2026-04-01T10:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    const due = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-03" });

    expect(due.total).toBe("400.00");
    expect(due.cards).toHaveLength(1);
    expect(due.cards[0]?.total).toBe("400.00");
  });

  it("prioritizes persisted invoice cycle fields and keeps fallback for legacy data", () => {
    const card = cards.createCard({ householdId, name: "Persisted", closeDay: 5, dueDay: 10 });
    const category = categories.createCategory({ householdId, name: "Tecnologia" });

    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Persistido manualmente",
      amount: "300.00",
      occurredAt: "2026-04-04T10:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-06",
      invoiceDueDate: "2026-06-10T00:00:00.000Z",
      transferGroupId: null,
    });

    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Legado sem materializacao",
      amount: "200.00",
      occurredAt: "2026-04-04T10:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      transferGroupId: null,
    });

    const juneDue = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-06" });
    const aprilDue = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-04" });

    expect(juneDue.total).toBe("300.00");
    expect(aprilDue.total).toBe("200.00");
  });
});
