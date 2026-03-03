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
import { FreeBalancePolicy } from "../../src/modules/free-balance/free-balance.policy";
import { FreeBalanceService } from "../../src/modules/free-balance/free-balance.service";
import { InvoiceCycleService } from "../../src/modules/invoices/invoice-cycle.service";
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

const accounts = new AccountsController(new AccountsService(accountsRepo));
const cards = new CardsController(new CardsService(cardsRepo));
const categories = new CategoriesController(new CategoriesService(categoriesRepo));
const transactions = new TransactionsController(
  new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
);

const freeBalance = new FreeBalanceService(
  accountsRepo,
  cardsRepo,
  transactionsRepo,
  scheduleRepo,
  new InvoiceCycleService(),
  new FreeBalancePolicy(),
);

describe("free balance service", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();
  });

  it("computes current and next month with explainable positive capacity", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta Casa",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const card = cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Casa" });

    transactions.createTransaction({
      householdId,
      kind: "INCOME",
      description: "Salario marco",
      amount: "3000.00",
      occurredAt: "2026-03-01T12:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Mercado conta",
      amount: "700.00",
      occurredAt: "2026-03-02T12:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra cartao",
      amount: "300.00",
      occurredAt: "2026-03-04T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    transactions.createTransaction({
      householdId,
      kind: "INCOME",
      description: "Salario abril",
      amount: "2500.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    const result = freeBalance.getFreeBalance({ householdId, month: "2026-03" });

    expect(result.freeBalanceCurrent).toBe("3300.00");
    expect(result.freeBalanceNext).toBe("5500.00");
    expect(result.additionalCardSpendCapacity).toBe("5500.00");
    expect(result.breakdown.next.components.cardInvoiceDue).toBe("300.00");
    expect(result.risk).toBe("GREEN");
  });

  it("flags red risk when next month invoice pushes projection negative", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta enxuta",
      type: "CHECKING",
      openingBalance: "200.00",
    });
    const card = cards.createCard({ householdId, name: "Master", closeDay: 10, dueDay: 20 });
    const category = categories.createCategory({ householdId, name: "Compras" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra cartao pesada",
      amount: "900.00",
      occurredAt: "2026-03-05T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const result = freeBalance.getFreeBalance({ householdId, month: "2026-03" });

    expect(result.freeBalanceNext).toBe("-700.00");
    expect(result.additionalCardSpendCapacity).toBe("-700.00");
    expect(result.risk).toBe("RED");
    expect(result.topDrivers[0]?.label).toBe("Fatura de cartao");
  });

  it("marks low confidence when key forecast data is missing", () => {
    accounts.createAccount({
      householdId,
      name: "Conta inicial",
      type: "CHECKING",
      openingBalance: "100.00",
    });

    const result = freeBalance.getFreeBalance({ householdId, month: "2026-03" });

    expect(result.confidence).toBe("LOW");
    expect(result.missingData.length).toBeGreaterThan(0);
  });

  it("carries negative current month as late carry into next month", () => {
    const account = accounts.createAccount({
      householdId,
      name: "Conta atraso",
      type: "CHECKING",
      openingBalance: "100.00",
    });
    const category = categories.createCategory({ householdId, name: "Fixas" });

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Aluguel",
      amount: "300.00",
      occurredAt: "2026-03-01T12:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    const result = freeBalance.getFreeBalance({ householdId, month: "2026-03" });

    expect(result.freeBalanceCurrent).toBe("-200.00");
    expect(result.breakdown.next.components.lateCarry).toBe("200.00");
  });
});
