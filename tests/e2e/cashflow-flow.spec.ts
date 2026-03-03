// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

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
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";

describe("cashflow flow", () => {
  beforeEach(() => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });
  });

  it("records entries and renders premium tags with category/destination labels", async () => {
    const user = userEvent.setup();

    render(React.createElement(CashflowPage));

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.type(screen.getByLabelText("Descricao da transacao"), "Salario");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "5000.00");
    await user.click(screen.getByRole("button", { name: "Adicionar lancamento" }));

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.selectOptions(screen.getByLabelText("Tipo da transacao"), "EXPENSE");
    await user.type(screen.getByLabelText("Descricao da transacao"), "Supermercado cartao");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "200.00");
    await user.selectOptions(screen.getByLabelText("Destino da transacao"), "card");
    await user.click(screen.getByRole("button", { name: "Adicionar lancamento" }));

    expect(screen.getByText("Salario")).toBeInTheDocument();
    expect(screen.getByText("Supermercado cartao")).toBeInTheDocument();
    expect(screen.getAllByText("Mercado").length).toBeGreaterThan(0);
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Saida")).toBeInTheDocument();
    expect(screen.getByText("Cartao: Visa Casa")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar" })[0]!);
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Salario ajustado");
    await user.click(screen.getByRole("button", { name: "Salvar edicao" }));

    expect(screen.getByText("Salario ajustado")).toBeInTheDocument();
  });
});
