// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AppShell } from "../../src/components/layout/app-shell";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

describe("foundation flow", () => {
  beforeEach(() => {
    new AccountsRepository().clearAll();
    new CardsRepository().clearAll();
    new CategoriesRepository().clearAll();
    new TransactionsRepository().clearAll();
    document.documentElement.classList.add("dark");
  });

  it("navigates through shell and creates account", async () => {
    const user = userEvent.setup();

    function ShellHarness() {
      const [route, setRoute] = React.useState<"cashflow" | "accounts" | "cards" | "categories" | "schedules">("cashflow");
      const [darkMode, setDarkMode] = React.useState(true);

      React.useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
      }, [darkMode]);

      return React.createElement(AppShell, { route, onRouteChange: setRoute, darkMode, onDarkModeChange: setDarkMode });
    }

    render(React.createElement(ShellHarness));

    await user.click(screen.getAllByRole("tab", { name: "Contas" })[0]!);

    await user.clear(screen.getByLabelText("Nome da conta"));
    await user.type(screen.getByLabelText("Nome da conta"), "Conta Casa");
    await user.clear(screen.getByLabelText("Saldo inicial"));
    await user.type(screen.getByLabelText("Saldo inicial"), "500.00");
    await user.click(screen.getByRole("button", { name: "Adicionar conta" }));

    expect(screen.getByText(/Conta Casa/)).toBeInTheDocument();
    expect(screen.getByTestId("consolidated-balance")).toHaveTextContent("R$ 500.00");
  });

  it("toggles theme and can register card and category", async () => {
    const user = userEvent.setup();

    function ShellHarness() {
      const [route, setRoute] = React.useState<"cashflow" | "accounts" | "cards" | "categories" | "schedules">("cards");
      const [darkMode, setDarkMode] = React.useState(true);

      React.useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
      }, [darkMode]);

      return React.createElement(AppShell, { route, onRouteChange: setRoute, darkMode, onDarkModeChange: setDarkMode });
    }

    render(React.createElement(ShellHarness));

    await user.click(screen.getAllByRole("button", { name: "Alternar tema" })[0]!);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.type(screen.getByLabelText("Nome do cartao"), "Visa Casa");
    await user.clear(screen.getByLabelText("Dia de fechamento"));
    await user.type(screen.getByLabelText("Dia de fechamento"), "7");
    await user.click(screen.getByRole("button", { name: "Adicionar cartao" }));
    expect(screen.getByText(/Visa Casa/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Categorias|Tags/ })[0]!);
    await user.type(screen.getByLabelText("Nome da categoria"), "Mercado");
    await user.click(screen.getByRole("button", { name: "Adicionar categoria" }));
    expect(screen.getByText("Mercado")).toBeInTheDocument();
  });
});
