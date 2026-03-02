// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import AccountsPage from "../../src/app/foundation/accounts/page";
import CardsPage from "../../src/app/foundation/cards/page";
import CategoriesPage from "../../src/app/foundation/categories/page";

describe("foundation flow", () => {
  beforeEach(() => {
    new AccountsRepository().clearAll();
    new CardsRepository().clearAll();
    new CategoriesRepository().clearAll();
  });

  it("creates account and updates consolidated balance", async () => {
    const user = userEvent.setup();
    render(React.createElement(AccountsPage));

    await user.clear(screen.getByLabelText("Nome da conta"));
    await user.type(screen.getByLabelText("Nome da conta"), "Conta Casa");
    await user.clear(screen.getByLabelText("Saldo inicial"));
    await user.type(screen.getByLabelText("Saldo inicial"), "500.00");
    await user.click(screen.getByRole("button", { name: "Adicionar conta" }));

    expect(screen.getByText(/Conta Casa/)).toBeInTheDocument();
    expect(screen.getByTestId("consolidated-balance")).toHaveTextContent("R$ 500.00");
  });

  it("creates card and category in dedicated pages", async () => {
    const user = userEvent.setup();

    render(React.createElement(CardsPage));
    await user.type(screen.getByLabelText("Nome do cartao"), "Visa Casa");
    await user.clear(screen.getByLabelText("Dia de fechamento"));
    await user.type(screen.getByLabelText("Dia de fechamento"), "7");
    await user.click(screen.getByRole("button", { name: "Adicionar cartao" }));
    expect(screen.getByText(/Visa Casa/)).toBeInTheDocument();

    render(React.createElement(CategoriesPage));
    await user.type(screen.getByLabelText("Nome da categoria"), "Mercado");
    await user.click(screen.getByRole("button", { name: "Adicionar categoria" }));
    expect(screen.getByText("Mercado")).toBeInTheDocument();
  });
});
