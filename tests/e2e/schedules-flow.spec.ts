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
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

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

  it("creates, edits and stops recurring schedules without breaking history", async () => {
    const user = userEvent.setup();

    render(React.createElement(SchedulesPage));

    await user.type(screen.getByLabelText("Descricao recorrencia"), "Academia");
    await user.clear(screen.getByLabelText("Valor recorrencia"));
    await user.type(screen.getByLabelText("Valor recorrencia"), "100.00");
    await user.click(screen.getByRole("button", { name: "Adicionar recorrencia" }));

    await user.type(screen.getByLabelText("Descricao parcela"), "Notebook");
    await user.clear(screen.getByLabelText("Valor total parcelado"));
    await user.type(screen.getByLabelText("Valor total parcelado"), "900.00");
    await user.clear(screen.getByLabelText("Quantidade parcelas"));
    await user.type(screen.getByLabelText("Quantidade parcelas"), "3");
    await user.click(screen.getByRole("button", { name: "Adicionar parcela" }));

    expect(screen.getAllByText(/Academia/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Notebook/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Aplicar edicao recorrencia" }));
    await user.click(screen.getByRole("button", { name: "Encerrar recorrencia" }));

    expect(screen.getAllByText(/inativa/).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("schedule-instance").length).toBeGreaterThan(0);
  });
});
