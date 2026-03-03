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
import { TransactionsController } from "../../src/modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const householdId = "household-main";

const accountsRepository = new AccountsRepository();
const cardsRepository = new CardsRepository();
const categoriesRepository = new CategoriesRepository();
const transactionsRepository = new TransactionsRepository();

const accountsController = new AccountsController(new AccountsService(accountsRepository));
const cardsController = new CardsController(new CardsService(cardsRepository));
const categoriesController = new CategoriesController(new CategoriesService(categoriesRepository));

const transactionsController = new TransactionsController(
  new TransactionsService(transactionsRepository, accountsRepository, cardsRepository, categoriesRepository),
);

describe("transactions api", () => {
  beforeEach(() => {
    accountsRepository.clearAll();
    cardsRepository.clearAll();
    categoriesRepository.clearAll();
    transactionsRepository.clearAll();
  });

  it("creates valid income and expense entries", () => {
    const account = accountsController.createAccount({
      householdId,
      name: "Conta Casa",
      type: "CHECKING",
      openingBalance: "1000.00",
    });

    const card = cardsController.createCard({
      householdId,
      name: "Visa",
      closeDay: 5,
      dueDay: 12,
    });

    const category = categoriesController.createCategory({ householdId, name: "Mercado" });

    transactionsController.createTransaction({
      householdId,
      kind: "INCOME",
      description: "Salario",
      amount: "3000.00",
      occurredAt: "2026-03-02T10:00:00.000Z",
      accountId: account.id,
      categoryId: category.id,
    });

    transactionsController.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra no cartao",
      amount: "250.00",
      occurredAt: "2026-03-03T10:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    const march = transactionsController.listTransactionsByMonth({ householdId, month: "2026-03" });
    expect(march).toHaveLength(2);
  });

  it("enforces account-card binding rules", () => {
    const category = categoriesController.createCategory({ householdId, name: "Casa" });

    expect(() => {
      transactionsController.createTransaction({
        householdId,
        kind: "INCOME",
        description: "Entrada errada",
        amount: "100.00",
        occurredAt: "2026-03-03T10:00:00.000Z",
        categoryId: category.id,
      });
    }).toThrow("INCOME_REQUIRES_ACCOUNT_ONLY");

    expect(() => {
      transactionsController.createTransaction({
        householdId,
        kind: "EXPENSE",
        description: "Saida invalida",
        amount: "80.00",
        occurredAt: "2026-03-03T10:00:00.000Z",
        categoryId: category.id,
      });
    }).toThrow("EXPENSE_REQUIRES_SINGLE_TARGET");
  });

  it("requires category and validates ownership", () => {
    const account = accountsController.createAccount({
      householdId,
      name: "Conta 2",
      type: "CHECKING",
      openingBalance: "100.00",
    });

    expect(() => {
      transactionsController.createTransaction({
        householdId,
        kind: "INCOME",
        description: "Entrada",
        amount: "100.00",
        occurredAt: "2026-03-03T10:00:00.000Z",
        accountId: account.id,
        categoryId: "missing-category",
      });
    }).toThrow("CATEGORY_NOT_FOUND");
  });

  it("creates and maintains investment transfer atomically", () => {
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
    const category = categoriesController.createCategory({ householdId, name: "Investimento" });

    const transfer = transactionsController.createInvestmentTransfer({
      householdId,
      description: "Aporte mensal",
      amount: "500.00",
      occurredAt: "2026-03-15T12:00:00.000Z",
      categoryId: category.id,
      sourceAccountId: checking.id,
      destinationAccountId: investment.id,
    });

    const march = transactionsController.listTransactionsByMonth({ householdId, month: "2026-03" });
    expect(march).toHaveLength(2);
    expect(march.every((item) => item.transferGroupId === transfer.transferGroupId)).toBe(true);
    expect(march.some((item) => item.kind === "EXPENSE" && item.accountId === checking.id)).toBe(true);
    expect(march.some((item) => item.kind === "INCOME" && item.accountId === investment.id)).toBe(true);

    const debit = march.find((item) => item.kind === "EXPENSE")!;

    expect(() =>
      transactionsController.updateTransaction({
        id: debit.id,
        householdId,
        kind: "EXPENSE",
        description: "Nao permitido",
        amount: "100.00",
        occurredAt: "2026-03-16T12:00:00.000Z",
        accountId: checking.id,
        categoryId: category.id,
      }),
    ).toThrow("INVESTMENT_TRANSFER_REQUIRES_GROUP_UPDATE");

    transactionsController.updateInvestmentTransfer({
      householdId,
      transferGroupId: transfer.transferGroupId,
      description: "Aporte ajustado",
      amount: "450.00",
      occurredAt: "2026-03-20T12:00:00.000Z",
      categoryId: category.id,
      sourceAccountId: checking.id,
      destinationAccountId: investment.id,
    });

    const afterEdit = transactionsController.listTransactionsByMonth({ householdId, month: "2026-03" });
    expect(afterEdit.every((item) => item.amount === "450.00")).toBe(true);
    expect(afterEdit.every((item) => item.description === "Aporte ajustado")).toBe(true);

    const incomeLeg = afterEdit.find((item) => item.kind === "INCOME")!;
    transactionsController.deleteTransaction({ id: incomeLeg.id, householdId });
    expect(transactionsController.listTransactionsByMonth({ householdId, month: "2026-03" })).toHaveLength(0);

    const recreated = transactionsController.createInvestmentTransfer({
      householdId,
      description: "Aporte novo",
      amount: "200.00",
      occurredAt: "2026-03-21T12:00:00.000Z",
      categoryId: category.id,
      sourceAccountId: checking.id,
      destinationAccountId: investment.id,
    });

    transactionsController.deleteInvestmentTransfer({ householdId, transferGroupId: recreated.transferGroupId });
    expect(transactionsController.listTransactionsByMonth({ householdId, month: "2026-03" })).toHaveLength(0);
  });
});
