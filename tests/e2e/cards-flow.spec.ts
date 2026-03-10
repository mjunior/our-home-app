// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import CardsPage from "../../src/app/foundation/cards/page";
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

const householdId = "household-main";

describe("cards flow", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  beforeEach(() => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });
  });

  it("edits recurring invoice entries only for the selected occurrence", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const scheduleRepo = new ScheduleRepository();

    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;

    const engine = new ScheduleEngineService();
    const scheduleManagement = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
    );

    const rule = scheduleManagement.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Streaming",
      amount: "90.00",
      startMonth: "2026-03",
      categoryId: category.id,
      creditCardId: card.id,
    });

    render(React.createElement(CardsPage));

    expect(await screen.findByText("Streaming")).toBeInTheDocument();
    await user.click(screen.getByText("Streaming"));
    expect(screen.getByLabelText("Escopo da edicao recorrente")).toHaveValue("THIS_ONLY");
    expect(screen.getByText("Esta edicao altera apenas esta ocorrencia da recorrencia.")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Streaming promo");
    await user.clear(screen.getByLabelText("Editar valor da transacao"));
    await user.type(screen.getByLabelText("Editar valor da transacao"), "120.00");
    await user.click(screen.getByRole("button", { name: "Salvar edicao" }));

    expect(await screen.findByText("Streaming promo")).toBeInTheDocument();
    expect(scheduleRepo.findInstanceBySourceMonth("RECURRING", rule.id, "2026-03")?.amount).toBe("120.00");
    expect(scheduleRepo.findInstanceBySourceMonth("RECURRING", rule.id, "2026-04")?.amount).toBe("90.00");
    expect(scheduleRepo.findRecurringRuleById(rule.id)?.active).toBe(true);
  });
});
