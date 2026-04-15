// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { RouteKey } from "../../src/app/routes";
import { AppShell } from "../../src/components/layout/app-shell";
import { accountsController, cardsController, categoriesController, transactionsController } from "../../src/app/foundation/runtime";
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

  afterEach(() => {
    cleanup();
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.pointerEvents = "";
  });

  it("navigates through shell and creates account", async () => {
    const user = userEvent.setup();

    function ShellHarness() {
      const [route, setRoute] = React.useState<RouteKey>("cashflow");
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
    await user.click(screen.getByRole("button", { name: "Nova conta" }));

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

  it("creates and edits investment goal from accounts screen", async () => {
    const user = userEvent.setup();

    function ShellHarness() {
      const [route, setRoute] = React.useState<RouteKey>("accounts");
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

    await user.click(screen.getByRole("button", { name: "Nova conta" }));
    await user.type(screen.getByLabelText("Nome da conta"), "Reserva Invest");
    await user.selectOptions(screen.getByLabelText("Tipo da conta"), "INVESTMENT");
    await user.type(screen.getByLabelText("Objetivo da conta"), "1000.00");
    await user.click(screen.getByRole("button", { name: "Adicionar conta" }));

    expect(screen.getByText("Meta: R$ 1000.00")).toBeInTheDocument();
    expect(screen.getByText("Faltam R$ 1000.00 para atingir a meta.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar objetivo da Reserva Invest" }));
    const goalInput = screen.getByLabelText("Objetivo da conta");
    await user.clear(goalInput);
    await user.type(goalInput, "500.00");
    await user.click(screen.getByRole("button", { name: "Salvar objetivo" }));

    expect(screen.getByText("Meta: R$ 500.00")).toBeInTheDocument();
    expect(screen.getByText("Faltam R$ 500.00 para atingir a meta.")).toBeInTheDocument();
  });

  it("adjusts account balance from accounts screen and records paid adjustment transaction", async () => {
    const user = userEvent.setup();

    accountsController.createAccount({
      householdId: "household-main",
      name: "Conta Ajuste",
      type: "CHECKING",
      openingBalance: "500.00",
    });

    function ShellHarness() {
      const [route, setRoute] = React.useState<RouteKey>("accounts");
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

    await user.click(screen.getByRole("button", { name: "Reajustar saldo da Conta Ajuste" }));
    expect(screen.getAllByText("Conta Ajuste").length).toBeGreaterThan(0);
    expect(screen.getByText("Saldo atual no app: R$ 500.00")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Valor real"));
    await user.type(screen.getByLabelText("Valor real"), "65000");
    await user.clear(screen.getByLabelText("Mes de competencia"));
    await user.type(screen.getByLabelText("Mes de competencia"), "2026-04");
    await user.clear(screen.getByLabelText("Data do reajuste"));
    await user.type(screen.getByLabelText("Data do reajuste"), "2026-04-15");
    await user.click(screen.getByRole("button", { name: "Salvar reajuste" }));

    expect(screen.getByTestId("consolidated-balance")).toHaveTextContent("R$ 650.00");

    const adjustments = transactionsController
      .listTransactionsByMonth({ householdId: "household-main", month: "2026-04" })
      .filter((transaction) => transaction.description === "REAJUSTE");

    expect(adjustments).toHaveLength(1);
    expect(adjustments[0]).toMatchObject({
      kind: "INCOME",
      amount: "150.00",
      settlementStatus: "PAID",
      occurredAt: "2026-04-15T12:00:00.000Z",
    });
  });

  it("toggles theme and can register card and category", async () => {
    const user = userEvent.setup();

    function ShellHarness() {
      const [route, setRoute] = React.useState<RouteKey>("cards");
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

    await user.click(screen.getByRole("button", { name: "Novo cartao" }));
    await user.type(screen.getByLabelText("Nome do cartao"), "Visa Casa");
    await user.clear(screen.getByLabelText("Dia de fechamento"));
    await user.type(screen.getByLabelText("Dia de fechamento"), "7");
    await user.click(screen.getByRole("button", { name: "Adicionar cartao" }));
    expect(screen.getAllByText(/Visa Casa/).length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const closeDayInput = screen.getByLabelText("Dia de fechamento");
    await user.clear(closeDayInput);
    await user.type(closeDayInput, "2");
    const dueDayInput = screen.getByLabelText("Dia de vencimento");
    await user.clear(dueDayInput);
    await user.type(dueDayInput, "20");
    await user.click(screen.getByRole("button", { name: "Salvar cartao" }));
    expect(screen.getByText(/fecha 2 vence 20/)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /Categorias|Tags/ })[0]!);
    await user.click(screen.getByRole("button", { name: "Nova categoria" }));
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

  it("navigates from invoice row to cards with context", async () => {
    const user = userEvent.setup();

    const account = accountsController.createAccount({
      householdId: "household-main",
      name: "Conta Base",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const card = cardsController.createCard({
      householdId: "household-main",
      name: "Visa Navegacao",
      closeDay: 5,
      dueDay: 12,
    });
    const category = categoriesController.createCategory({ householdId: "household-main", name: "Lazer" });

    function ShellHarness() {
      const [route, setRoute] = React.useState<RouteKey>("cashflow");
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

    await user.click(screen.getAllByRole("button", { name: "Novo lancamento" })[0]!);
    await user.selectOptions(screen.getByLabelText("Tipo da transacao"), "EXPENSE");
    await user.type(screen.getByLabelText("Descricao da transacao"), "Cinema");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "120.00");
    await user.selectOptions(screen.getByLabelText("Destino da transacao"), "card");
    await user.selectOptions(screen.getByLabelText("Opcao de destino"), card.id);
    await user.selectOptions(screen.getByLabelText("Categoria da transacao"), category.id);
    await user.clear(screen.getByLabelText("Data da transacao"));
    await user.type(screen.getByLabelText("Data da transacao"), "2026-03-01");
    await user.click(screen.getByRole("button", { name: "Adicionar lancamento" }));

    expect(account.id).toBeDefined();
    await waitFor(() => expect(screen.getByText("Fatura Visa Navegacao")).toBeInTheDocument());

    await user.click(screen.getByText("Fatura Visa Navegacao"));

    expect(screen.getAllByText("Cartoes cadastrados").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Faturas do mes 2026-03").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cinema").length).toBeGreaterThan(0);

    await user.click(screen.getAllByText("Cinema")[0]!);
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Cinema VIP");
    await user.clear(screen.getByLabelText("Editar valor da transacao"));
    await user.type(screen.getByLabelText("Editar valor da transacao"), "80.00");
    await user.click(screen.getAllByRole("button", { name: "Salvar edicao" })[0]!);

    expect(screen.getAllByText("Cinema VIP").length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole("tab", { name: "Caixa" })[0]!);
    expect(screen.getAllByText("Fatura Visa Navegacao").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/R\$\s*80[,.]00/).length).toBeGreaterThan(0);
  });
});
