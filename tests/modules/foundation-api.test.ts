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

const accountsController = new AccountsController(new AccountsService(accountsRepo, transactionsRepo, undefined, scheduleRepo));
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
});
