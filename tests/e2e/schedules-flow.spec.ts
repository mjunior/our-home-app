// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import SchedulesPage from "../../src/app/foundation/schedules/page";
import { AccountsController } from "../../src/modules/accounts/accounts.controller";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { CardsController } from "../../src/modules/cards/cards.controller";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CardsService } from "../../src/modules/cards/cards.service";
import { CategoriesController } from "../../src/modules/categories/categories.controller";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { CategoriesService } from "../../src/modules/categories/categories.service";
import { InstallmentsService } from "../../src/modules/scheduling/installments.service";
import { RecurrenceService } from "../../src/modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../src/modules/scheduling/schedule-engine.service";
import { ScheduleManagementService } from "../../src/modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const householdId = "household-main";

describe("schedules flow", () => {
  beforeEach(() => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const scheduleRepo = new ScheduleRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    scheduleRepo.clearAll();
    new TransactionsRepository().clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });
  });

  it("manages existing recurring schedules without breaking history", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const scheduleRepo = new ScheduleRepository();
    const transactionsRepo = new TransactionsRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    scheduleRepo.clearAll();
    transactionsRepo.clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    const account = accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Mercado" });

    const scheduleManagement = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, new ScheduleEngineService()),
      new RecurrenceService(scheduleRepo, new ScheduleEngineService()),
      new ScheduleEngineService(),
      new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo),
    );

    scheduleManagement.createUnifiedLaunch({
      launchType: "RECURRING",
      recurring: {
        householdId,
        kind: "EXPENSE",
        description: "Academia",
        amount: "100.00",
        startMonth: "2026-03",
        categoryId: category.id,
        accountId: account.id,
      },
    });

    render(React.createElement(SchedulesPage));

    expect(screen.getByText(/Criacao centralizada no Cashflow/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Academia/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Aplicar edicao recorrencia" }));
    await user.click(screen.getByRole("button", { name: "Encerrar recorrencia" }));

    expect(screen.getAllByText(/inativa/).length).toBeGreaterThan(0);
  });
});
