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
import { InvoiceSettlementRepository } from "../../src/modules/invoices/invoice-settlement.repository";
import { InvoicesService } from "../../src/modules/invoices/invoices.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsController } from "../../src/modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const householdId = "household-main";

const accountsRepo = new AccountsRepository();
const cardsRepo = new CardsRepository();
const categoriesRepo = new CategoriesRepository();
const transactionsRepo = new TransactionsRepository();
const scheduleRepo = new ScheduleRepository();
const invoiceSettlementRepo = new InvoiceSettlementRepository();

const accounts = new AccountsController(new AccountsService(accountsRepo));
const cards = new CardsController(new CardsService(cardsRepo));
const categories = new CategoriesController(new CategoriesService(categoriesRepo));
const transactions = new TransactionsController(
  new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
);
const invoices = new InvoicesController(
  new InvoicesService(transactionsRepo, cardsRepo, new InvoiceCycleService(), scheduleRepo, invoiceSettlementRepo),
);

describe("invoice services", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();
    invoiceSettlementRepo.clearAll();
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
    expect(due.cards[0]?.dueDay).toBe(18);
    expect(due.cards[0]?.dueDate).toBe("2026-03-18T00:00:00.000Z");
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
      settlementStatus: null,
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
      settlementStatus: null,
      transferGroupId: null,
    });

    const juneDue = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-06" });
    const aprilDue = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-04" });

    expect(juneDue.total).toBe("300.00");
    expect(aprilDue.total).toBe("200.00");
  });

  it("includes scheduled credit card instances due in month in consolidated invoice", () => {
    const card = cards.createCard({ householdId, name: "C6", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Assinatura" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra avulsa",
      amount: "100.00",
      occurredAt: "2026-03-04T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "RECURRING",
      sourceId: "rule-1",
      sequence: 1,
      monthKey: "2026-03",
      occurredAt: "2026-03-12T12:00:00.000Z",
      kind: "EXPENSE",
      description: "Streaming",
      amount: "50.00",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      instanceKey: "RECURRING:rule-1:1:2026-03",
      locked: false,
      settlementStatus: null,
    });

    const due = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-03" });
    expect(due.total).toBe("150.00");
    expect(due.cards[0]?.total).toBe("150.00");
  });

  it("lists invoice entries for card and due month with one-off and scheduled items", () => {
    const card = cards.createCard({ householdId, name: "Detalhe Fatura", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Lazer" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Cinema",
      amount: "120.00",
      occurredAt: "2026-03-01T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "INSTALLMENT",
      sourceId: "installment-1",
      sequence: 2,
      monthKey: "2026-03",
      occurredAt: "2026-03-12T12:00:00.000Z",
      kind: "EXPENSE",
      description: "Notebook (2/10)",
      amount: "80.00",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      instanceKey: "INSTALLMENT:installment-1:2:2026-03",
      locked: false,
      settlementStatus: null,
    });

    const details = invoices.getCardInvoiceEntriesByDueMonth({ householdId, cardId: card.id, dueMonth: "2026-03" });
    expect(details.total).toBe("200.00");
    expect(details.entries).toHaveLength(2);
    expect(
      details.entries.some(
        (entry) =>
          entry.description === "Cinema" &&
          entry.sourceType === "ONE_OFF" &&
          entry.sourceId === null &&
          entry.monthKey === null,
      ),
    ).toBe(true);
    expect(
      details.entries.some(
        (entry) =>
          entry.description === "Notebook (2/10)" &&
          entry.sourceType === "INSTALLMENT" &&
          entry.sourceId === "installment-1" &&
          entry.monthKey === "2026-03",
      ),
    ).toBe(true);
  });

  it("returns registered dates and groups invoice entries by operational source", () => {
    const card = cards.createCard({ householdId, name: "Auditoria Fatura", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Auditoria" });

    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra antiga",
      amount: "30.00",
      occurredAt: "2026-03-02T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-03",
      invoiceDueDate: "2026-03-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
      createdAt: "2026-03-10T09:00:00.000Z",
    });

    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra nova",
      amount: "40.00",
      occurredAt: "2026-03-01T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-03",
      invoiceDueDate: "2026-03-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
      createdAt: "2026-03-12T09:00:00.000Z",
    });

    const installmentPlan = scheduleRepo.createInstallmentPlan({
      householdId,
      description: "Notebook",
      totalAmount: "300.00",
      installmentsCount: 3,
      startMonth: "2026-03",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      active: true,
      createdAt: "2026-03-08T09:00:00.000Z",
    });
    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "INSTALLMENT",
      sourceId: installmentPlan.id,
      sequence: 1,
      monthKey: "2026-03",
      occurredAt: "2026-03-01T12:00:00.000Z",
      kind: "EXPENSE",
      description: "Notebook (1/3)",
      amount: "100.00",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      instanceKey: `INSTALLMENT:${installmentPlan.id}:1:2026-03`,
      locked: false,
      settlementStatus: null,
    });

    const recurringRule = scheduleRepo.createRecurringRule({
      householdId,
      kind: "EXPENSE",
      description: "Streaming",
      amount: "50.00",
      startMonth: "2026-03",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      active: true,
      revisionOfRuleId: null,
      createdAt: "2026-03-20T09:00:00.000Z",
    });
    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "RECURRING",
      sourceId: recurringRule.id,
      sequence: 1,
      monthKey: "2026-03",
      occurredAt: "2026-03-01T12:00:00.000Z",
      kind: "EXPENSE",
      description: "Streaming",
      amount: "50.00",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      instanceKey: `RECURRING:${recurringRule.id}:1:2026-03`,
      locked: false,
      settlementStatus: null,
    });

    const details = invoices.getCardInvoiceEntriesByDueMonth({ householdId, cardId: card.id, dueMonth: "2026-03" });

    expect(details.entries.map((entry) => entry.description)).toEqual([
      "Compra nova",
      "Compra antiga",
      "Notebook (1/3)",
      "Streaming",
    ]);
    expect(details.entries.find((entry) => entry.description === "Compra nova")?.registeredAt).toBe("2026-03-12T09:00:00.000Z");
    expect(details.entries.find((entry) => entry.description === "Notebook (1/3)")?.registeredAt).toBe("2026-03-08T09:00:00.000Z");
    expect(details.entries.find((entry) => entry.description === "Notebook (1/3)")?.installmentSequence).toBe(1);
    expect(details.entries.find((entry) => entry.description === "Streaming")?.registeredAt).toBe("2026-03-20T09:00:00.000Z");
  });

  it("places ongoing installments before latest launches while first installments stay with latest launches", () => {
    const card = cards.createCard({ householdId, name: "Parcelas Reais", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Compras Parceladas" });

    const ongoingPlan = scheduleRepo.createInstallmentPlan({
      householdId,
      description: "Sofa",
      totalAmount: "800.00",
      installmentsCount: 4,
      startMonth: "2026-02",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      active: true,
      createdAt: "2026-02-01T09:00:00.000Z",
    });
    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "INSTALLMENT",
      sourceId: ongoingPlan.id,
      sequence: 2,
      monthKey: "2026-03",
      occurredAt: "2026-03-01T12:00:00.000Z",
      kind: "EXPENSE",
      description: "Sofa (2/4)",
      amount: "200.00",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      instanceKey: `INSTALLMENT:${ongoingPlan.id}:2:2026-03`,
      locked: false,
      settlementStatus: null,
    });

    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Mercado",
      amount: "70.00",
      occurredAt: "2026-03-04T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-03",
      invoiceDueDate: "2026-03-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
      createdAt: "2026-03-20T09:00:00.000Z",
    });

    const firstInstallmentPlan = scheduleRepo.createInstallmentPlan({
      householdId,
      description: "Fone",
      totalAmount: "100.00",
      installmentsCount: 2,
      startMonth: "2026-03",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      active: true,
      createdAt: "2026-03-19T09:00:00.000Z",
    });
    scheduleRepo.createInstanceIfMissing({
      householdId,
      sourceType: "INSTALLMENT",
      sourceId: firstInstallmentPlan.id,
      sequence: 1,
      monthKey: "2026-03",
      occurredAt: "2026-03-01T12:00:00.000Z",
      kind: "EXPENSE",
      description: "Fone (1/2)",
      amount: "50.00",
      categoryId: category.id,
      accountId: null,
      creditCardId: card.id,
      instanceKey: `INSTALLMENT:${firstInstallmentPlan.id}:1:2026-03`,
      locked: false,
      settlementStatus: null,
    });

    const details = invoices.getCardInvoiceEntriesByDueMonth({ householdId, cardId: card.id, dueMonth: "2026-03" });

    expect(details.entries.map((entry) => entry.description)).toEqual(["Sofa (2/4)", "Mercado", "Fone (1/2)"]);
    expect(details.entries[0]?.installmentSequence).toBe(2);
    expect(details.entries[2]?.installmentSequence).toBe(1);
  });

  it("recomputes consolidated invoice total after card expense edits and deletes", () => {
    const card = cards.createCard({ householdId, name: "Master Recalc", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Casa" });

    const first = transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra 1",
      amount: "100.00",
      occurredAt: "2026-03-03T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const second = transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra 2",
      amount: "50.00",
      occurredAt: "2026-03-03T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    let due = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-03" });
    expect(due.total).toBe("150.00");

    transactions.updateTransaction({
      id: second.id,
      householdId,
      kind: "EXPENSE",
      description: "Compra 2 ajustada",
      amount: "80.00",
      occurredAt: "2026-03-03T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    due = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-03" });
    expect(due.total).toBe("180.00");

    transactions.deleteTransaction({ id: first.id, householdId });
    due = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-03" });
    expect(due.total).toBe("80.00");
  });

  it("applies negative expenses as chargeback in invoice total", () => {
    const card = cards.createCard({ householdId, name: "Master Estorno", closeDay: 5, dueDay: 10 });
    const category = categories.createCategory({ householdId, name: "Compras" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra",
      amount: "100.00",
      occurredAt: "2026-03-03T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Estorno",
      amount: "-30.00",
      occurredAt: "2026-03-03T10:30:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const due = invoices.getDueObligationsByMonth({ householdId, dueMonth: "2026-03" });
    expect(due.total).toBe("70.00");
    expect(due.cards.find((item) => item.cardId === card.id)?.total).toBe("70.00");
  });

  it("returns monthly invoices list by due month", () => {
    const card = cards.createCard({ householdId, name: "Lista Mensal", closeDay: 5, dueDay: 10 });
    const emptyCard = cards.createCard({ householdId, name: "Sem Movimentacao", closeDay: 7, dueDay: 15 });
    const category = categories.createCategory({ householdId, name: "Compras" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Item mensal",
      amount: "90.00",
      occurredAt: "2026-03-01T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const monthly = invoices.getMonthlyInvoices({ householdId, month: "2026-03" });
    expect(monthly.month).toBe("2026-03");
    expect(monthly.total).toBe("90.00");
    expect(monthly.cards).toHaveLength(2);
    expect(monthly.cards.find((item) => item.cardId === card.id)?.total).toBe("90.00");
    expect(monthly.cards.find((item) => item.cardId === emptyCard.id)?.total).toBe("0.00");
  });

  it("marks invoice as paid/unpaid for card and due month", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta Pagadora",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const card = cards.createCard({ householdId, name: "Fatura Pay", closeDay: 5, dueDay: 10 });
    const category = categories.createCategory({ householdId, name: "Casa" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra A",
      amount: "100.00",
      occurredAt: "2026-03-01T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    let monthly = invoices.getMonthlyInvoices({ householdId, month: "2026-03" });
    expect(monthly.cards.find((item) => item.cardId === card.id)?.paid).toBe(false);

    invoices.settleInvoice({
      householdId,
      cardId: card.id,
      dueMonth: "2026-03",
      paymentAccountId: account.id,
      paidAt: "2026-03-10T12:00:00.000Z",
      paidAmount: "100.00",
    });

    monthly = invoices.getMonthlyInvoices({ householdId, month: "2026-03" });
    expect(monthly.cards.find((item) => item.cardId === card.id)?.paid).toBe(true);
    expect(monthly.cards.find((item) => item.cardId === card.id)?.paymentAccountId).toBe(account.id);

    invoices.unsettleInvoice({ householdId, cardId: card.id, dueMonth: "2026-03" });
    monthly = invoices.getMonthlyInvoices({ householdId, month: "2026-03" });
    expect(monthly.cards.find((item) => item.cardId === card.id)?.paid).toBe(false);
  });
});
