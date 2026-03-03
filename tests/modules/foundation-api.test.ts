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

const accountsController = new AccountsController(new AccountsService(accountsRepo));
const cardsController = new CardsController(new CardsService(cardsRepo));
const categoriesController = new CategoriesController(new CategoriesService(categoriesRepo));
const transactionsController = new TransactionsController(
  new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
);
const freeBalanceService = new FreeBalanceService(
  accountsRepo,
  cardsRepo,
  transactionsRepo,
  scheduleRepo,
  new InvoiceCycleService(),
  new FreeBalancePolicy(),
);

describe("foundation api", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();
  });

  it("creates and lists accounts with consolidated balance", () => {
    accountsController.createAccount({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.50",
    });

    accountsController.createAccount({
      householdId,
      name: "Conta Investimento",
      type: "INVESTMENT",
      openingBalance: "200.10",
    });

    expect(accountsController.listAccounts(householdId)).toHaveLength(2);
    expect(accountsController.getConsolidatedBalance(householdId)).toEqual({ amount: "1200.60" });
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
    expect(result.breakdown.next.components.cardInvoiceDue).toBe("250.00");
    expect(result.topDrivers.length).toBeGreaterThan(0);
  });
});
