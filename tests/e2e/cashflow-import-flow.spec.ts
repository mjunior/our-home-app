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
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CategoriesController } from "../../src/modules/categories/categories.controller";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { CategoriesService } from "../../src/modules/categories/categories.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";

describe("cashflow import flow", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const schedulesRepo = new ScheduleRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    schedulesRepo.clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "C6 Bank", type: "CHECKING", openingBalance: "1000.00" });
    categories.createCategory({ householdId, name: "Mercado" });
    categories.createCategory({ householdId, name: "Renda" });
  });

  it("processes textarea lines, shows invalid feedback and imports only valid launches", async () => {
    const user = userEvent.setup();
    render(React.createElement(CashflowPage));

    await user.click(screen.getByRole("button", { name: "Importar texto" }));
    expect(screen.getByText("Importacao por texto")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Linhas de importacao"),
      [
        "01/03 entrada salario 5000.00 renda c6 nao",
        "02/03 saida compra_bahamas 50.00 mercado c6 recorrente",
        "03/03 saida erro xx mercado c6 nao",
      ].join("\n"),
    );

    await user.click(screen.getByRole("button", { name: "Processar linhas" }));

    expect(screen.getByText("Validas: 2")).toBeInTheDocument();
    expect(screen.getByText("Invalidas: 1")).toBeInTheDocument();
    expect(screen.getByText(/Linha 3: VALOR_INVALIDO/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Importar lancamentos validos" }));

    expect(screen.getByText(/Importacao finalizada:/)).toBeInTheDocument();
    expect(screen.getByText("salario")).toBeInTheDocument();
    expect(screen.getByText("compra bahamas")).toBeInTheDocument();
  });
});
