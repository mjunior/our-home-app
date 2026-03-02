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

const householdId = "household-main";

const accountsRepo = new AccountsRepository();
const cardsRepo = new CardsRepository();
const categoriesRepo = new CategoriesRepository();

const accountsController = new AccountsController(new AccountsService(accountsRepo));
const cardsController = new CardsController(new CardsService(cardsRepo));
const categoriesController = new CategoriesController(new CategoriesService(categoriesRepo));

describe("foundation api", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
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
      name: "Poupanca",
      type: "SAVINGS",
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
});
