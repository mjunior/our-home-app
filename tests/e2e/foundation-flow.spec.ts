// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { AppShell } from "../../src/components/layout/app-shell";
import { cardsController, categoriesController, transactionsController } from "../../src/app/foundation/runtime";
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

      return React.createElement(AppShell, {
        route,
        onRouteChange: setRoute,
        darkMode,
        onDarkModeChange: setDarkMode,
        onLogout: () => undefined,
      });
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
    expect(screen.getAllByText("Conta corrente").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Conta investimento").length).toBeGreaterThan(0);
  });

  it("toggles theme and can register card and category", async () => {
    const user = userEvent.setup();

    function ShellHarness() {
      const [route, setRoute] = React.useState<"cashflow" | "accounts" | "cards" | "categories" | "schedules">("cards");
      const [darkMode, setDarkMode] = React.useState(true);

      React.useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
      }, [darkMode]);

      return React.createElement(AppShell, {
        route,
        onRouteChange: setRoute,
        darkMode,
        onDarkModeChange: setDarkMode,
        onLogout: () => undefined,
      });
    }

    render(React.createElement(ShellHarness));

    await user.click(screen.getAllByRole("button", { name: "Alternar tema" })[0]!);
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    await user.type(screen.getByLabelText("Nome do cartao"), "Visa Casa");
    await user.clear(screen.getByLabelText("Dia de fechamento"));
    await user.type(screen.getByLabelText("Dia de fechamento"), "7");
    await user.click(screen.getByRole("button", { name: "Adicionar cartao" }));
    expect(screen.getByText(/Visa Casa/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const closeDayInput = screen.getAllByLabelText("Dia de fechamento")[1]!;
    await user.clear(closeDayInput);
    await user.type(closeDayInput, "2");
    const dueDayInput = screen.getAllByLabelText("Dia de vencimento")[1]!;
    await user.clear(dueDayInput);
    await user.type(dueDayInput, "20");
    await user.click(screen.getByRole("button", { name: "Salvar cartao" }));
    expect(screen.getByText(/fecha 2 vence 20/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Categorias|Tags/ })[0]!);
    await user.type(screen.getByLabelText("Nome da categoria"), "Mercado");
    await user.click(screen.getByRole("button", { name: "Adicionar categoria" }));
    expect(screen.getByText("Mercado")).toBeInTheDocument();

    const createdCard = cardsController.listCards("household-main").find((item) => item.name === "Visa Casa");
    const createdCategory = categoriesController.listCategories("household-main").find((item) => item.name === "Mercado");

    expect(createdCard).toBeDefined();
    expect(createdCategory).toBeDefined();

    const transaction = transactionsController.createTransaction({
      householdId: "household-main",
      kind: "EXPENSE",
      description: "Compra apos edicao",
      amount: "99.00",
      occurredAt: "2026-04-04T12:00:00.000Z",
      creditCardId: createdCard!.id,
      categoryId: createdCategory!.id,
    });

    expect(transaction.invoiceDueDate).toBe("2026-05-20T00:00:00.000Z");
  });
});
