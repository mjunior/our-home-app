// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
import { InvoiceSettlementRepository } from "../../src/modules/invoices/invoice-settlement.repository";
import { SnackbarProvider } from "../../src/components/ui/snackbar";

const householdId = "household-main";

function renderCashflowPage() {
  return render(React.createElement(SnackbarProvider, null, React.createElement(CashflowPage)));
}

describe("free balance dashboard", () => {
  const scrollIntoView = vi.fn();

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    scrollIntoView.mockClear();
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });

    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const scheduleRepo = new ScheduleRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    scheduleRepo.clearAll();
    new TransactionsRepository().clearAll();
    new InvoiceSettlementRepository().clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });
  });

  it("shows clean dashboard with annual projection cards and statement only", async () => {
    const user = userEvent.setup();
    renderCashflowPage();
    expect(screen.getByRole("tab", { name: "Jan/26" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Abr/26", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Dez/26" })).toBeInTheDocument();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "center", behavior: "smooth" });
    expect(screen.getAllByText("Mes anterior").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Ir para proximo mes" }));
    expect(screen.getByRole("tab", { name: "Mai/26", selected: true })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ir para mes anterior" }));
    expect(screen.getByRole("tab", { name: "Abr/26", selected: true })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.type(screen.getByLabelText("Descricao da transacao"), "Salario");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "3000.00");
    await user.click(screen.getAllByRole("button", { name: "Adicionar lancamento" })[0]!);
    expect(await screen.findByText("Salario")).toBeInTheDocument();

    expect(screen.queryByLabelText("Semaforo saldo livre")).not.toBeInTheDocument();
    expect(screen.queryByText("Top 3 causas de pressao")).not.toBeInTheDocument();
    expect(screen.queryByText("Filtros do extrato")).not.toBeInTheDocument();
    expect(screen.queryByText("Mes atual")).not.toBeInTheDocument();
    expect(screen.queryByText("Proximo mes")).not.toBeInTheDocument();
    expect(screen.queryByText("Gastos mes")).not.toBeInTheDocument();
    expect(screen.queryByText("Pode aumentar no cartao")).not.toBeInTheDocument();
  });

  it("keeps high card spending in the monthly statement without rendering risk cards", async () => {
    const user = userEvent.setup();
    renderCashflowPage();

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
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
    await user.type(data, "2026-04-04");
    await user.click(screen.getAllByRole("button", { name: "Adicionar lancamento" })[0]!);

    expect(await screen.findByText("Fatura Visa Casa")).toBeInTheDocument();
    expect(screen.queryByTestId("free-balance-risk")).not.toBeInTheDocument();
  });

  it("lets the user close the month from the dashboard and refreshes the statement", async () => {
    const user = userEvent.setup();
    renderCashflowPage();

    await user.click(screen.getByRole("button", { name: "Fechar mes" }));
    const accountInput = await screen.findByLabelText("Valor real - Conta Casa");

    await user.clear(accountInput);
    await user.type(accountInput, "102500");

    await user.click(screen.getByRole("button", { name: "Confirmar fechamento" }));

    expect(screen.queryByText("REAJUSTE")).not.toBeInTheDocument();
    expect(await screen.findByText("Mes fechado com sucesso.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Confirmar fechamento" })).not.toBeInTheDocument();
  });

  it("seeds the month close sheet from the selected month, not the current balance snapshot", async () => {
    const user = userEvent.setup();
    renderCashflowPage();

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.type(screen.getByLabelText("Descricao da transacao"), "Lancamento futuro");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "30000");
    await user.clear(screen.getByLabelText("Data da transacao"));
    await user.type(screen.getByLabelText("Data da transacao"), "2026-04-20");
    await user.click(screen.getAllByRole("button", { name: "Adicionar lancamento" })[0]!);
    expect(await screen.findByText("Lancamento futuro")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Ir para mes anterior" }));
    await user.click(screen.getByRole("button", { name: "Fechar mes" }));

    expect(await screen.findByLabelText("Valor real - Conta Casa")).toHaveValue("1000.00");
  });
});
