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
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "C6 Bank", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Cartao C6", closeDay: 5, dueDay: 10 });
    categories.createCategory({ householdId, name: "Mercado" });
    categories.createCategory({ householdId, name: "Renda" });
    categories.createCategory({ householdId, name: "Outros" });
  });

  it("imports single and installment values from textarea, keeping invalid feedback", async () => {
    const user = userEvent.setup();
    render(React.createElement(CashflowPage));

    await user.click(screen.getByRole("button", { name: "Importar texto" }));
    expect(screen.getByText("Importacao por texto")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Linhas de importacao"),
      [
        "01/03 entrada salario 5000.00 renda c6 nao",
        "02/03 saida compra_bahamas 50.00 mercado c6 nao",
        "03/03 saida celular 50.22x3 mercado c6 recorrente",
        "04/03 saida notebook 150/3 mercado c6 nao",
        "05/03 saida erro xx mercado c6 nao",
      ].join("\n"),
    );

    await user.click(screen.getByRole("button", { name: "Processar linhas" }));

    expect(screen.getByText("Validas: 4")).toBeInTheDocument();
    expect(screen.getByText("Invalidas: 1")).toBeInTheDocument();
    expect(screen.getByText(/Linha 5: VALOR_INVALIDO/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Importar lancamentos validos" }));

    expect(screen.getByText(/Importacao finalizada:/)).toBeInTheDocument();
    expect(screen.getByText("salario")).toBeInTheDocument();
    expect(screen.getByText("compra bahamas")).toBeInTheDocument();
    expect(screen.getByText("celular (1/3) (1)")).toBeInTheDocument();
    expect(screen.getByText("notebook (1/3) (1)")).toBeInTheDocument();
  });

  it("starts imported credit-card installment in invoice month when purchase is after close day", async () => {
    const user = userEvent.setup();
    render(React.createElement(CashflowPage));

    await user.click(screen.getByRole("button", { name: "Importar texto" }));
    expect(screen.getByText("Importacao por texto")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Linhas de importacao"),
      "06/02 saida compra_pos_fechamento 120x3 outros cartaoc6 nao",
    );

    await user.click(screen.getByRole("button", { name: "Processar linhas" }));
    expect(screen.getByText("Validas: 1")).toBeInTheDocument();
    expect(screen.getByText("Invalidas: 0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Importar lancamentos validos" }));
    expect(screen.getByText("Fatura Cartao C6")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 120,00").length).toBeGreaterThan(0);
  });
});
