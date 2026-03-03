// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import CashflowPage from "../../src/app/foundation/cashflow/page";
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

describe("free balance dashboard", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("shows semaphore and detailed breakdown in dashboard", async () => {
    const user = userEvent.setup();
    render(React.createElement(CashflowPage));

    await user.type(screen.getByLabelText("Descricao da transacao"), "Salario");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "3000.00");
    await user.click(screen.getAllByRole("button", { name: "Adicionar lancamento" })[0]!);

    expect(screen.getByLabelText("Semaforo saldo livre")).toBeInTheDocument();
    expect(screen.getByLabelText("Composicao saldo livre")).toBeInTheDocument();
    expect(screen.getByLabelText("Top causas saldo livre")).toBeInTheDocument();
    expect(screen.getByTestId("free-balance-current")).toHaveTextContent("R$");
  });

  it("renders red alert when next month projection becomes negative", async () => {
    const user = userEvent.setup();
    render(React.createElement(CashflowPage));

    const tipo = screen.getAllByLabelText("Tipo da transacao")[0]!;
    const destino = screen.getAllByLabelText("Destino da transacao")[0]!;
    const descricao = screen.getAllByLabelText("Descricao da transacao")[0]!;
    const valor = screen.getAllByLabelText("Valor da transacao")[0]!;
    const data = screen.getAllByLabelText("Data da transacao")[0]!;

    await user.selectOptions(tipo, "EXPENSE");
    await user.selectOptions(destino, "card");
    await user.type(descricao, "Compra alta cartao");
    await user.clear(valor);
    await user.type(valor, "1900.00");
    await user.clear(data);
    await user.type(data, "2026-03-04");
    await user.click(screen.getAllByRole("button", { name: "Adicionar lancamento" })[0]!);

    expect(screen.getAllByTestId("free-balance-risk")[0]).toHaveTextContent("Risco");
    expect(screen.getByTestId("free-balance-alert-danger")).toBeInTheDocument();
  });
});
