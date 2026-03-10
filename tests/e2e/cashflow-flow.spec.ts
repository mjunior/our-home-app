// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
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
import { InstallmentsService } from "../../src/modules/scheduling/installments.service";
import { RecurrenceService } from "../../src/modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../src/modules/scheduling/schedule-engine.service";
import { ScheduleManagementService } from "../../src/modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";

describe("cashflow flow", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    accounts.createAccount({ householdId, name: "Reserva Invest", type: "INVESTMENT", openingBalance: "0.00", goalAmount: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });
  });

  it("records entries and renders premium tags with category/destination labels", async () => {
    const user = userEvent.setup();

    render(React.createElement(CashflowPage));
    expect(screen.getByRole("tab", { name: "Mar/26", selected: true })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ir para proximo mes" }));
    expect(screen.getByRole("tab", { name: "Abr/26", selected: true })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ir para mes anterior" }));
    expect(screen.getByRole("tab", { name: "Mar/26", selected: true })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.type(screen.getByLabelText("Descricao da transacao"), "Salario");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "5000.00");
    await user.click(screen.getByRole("button", { name: "Adicionar lancamento" }));
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();
    expect(screen.getByRole("tab", { name: "Investimento" })).toBeDisabled();
    expect(await screen.findByText("Salario")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.selectOptions(screen.getByLabelText("Tipo da transacao"), "EXPENSE");
    await user.type(screen.getByLabelText("Descricao da transacao"), "Supermercado cartao");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "200.00");
    await user.selectOptions(screen.getByLabelText("Destino da transacao"), "card");
    await user.click(screen.getByRole("button", { name: "Adicionar lancamento" }));
    expect(await screen.findByText("Fatura Visa Casa")).toBeInTheDocument();
    expect(screen.queryByText("Supermercado cartao")).not.toBeInTheDocument();
    expect(screen.getAllByText("Mercado").length).toBeGreaterThan(0);
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Saida")).toBeInTheDocument();
    expect(screen.getByText("Cartao: Visa Casa")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto")).toBeInTheDocument();
    expect(screen.getByTestId("current-real-balance")).toHaveTextContent("R$ 6.000,00");

    const invoiceRow = screen.getByText("Fatura Visa Casa").closest("tr");
    const salaryRow = screen.getByText("Salario").closest("tr");
    expect(invoiceRow).not.toBeNull();
    expect(salaryRow).not.toBeNull();

    await user.click(within(invoiceRow!).getByRole("button", { name: "Marcar como pago" }));
    expect(screen.getByTestId("current-real-balance")).toHaveTextContent("R$ 5.800,00");
    await user.click(within(invoiceRow!).getByRole("button", { name: "Marcar como nao pago" }));
    expect(screen.getByTestId("current-real-balance")).toHaveTextContent("R$ 6.000,00");

    await user.click(within(salaryRow!).getByRole("button", { name: "Marcar como nao pago" }));
    expect(screen.getByTestId("current-real-balance")).toHaveTextContent("R$ 1.000,00");

    await user.click(screen.getByRole("button", { name: "Abrir composicao do saldo atual" }));
    expect(screen.getByText("Detalhamento do saldo atual - Mes atual")).toBeInTheDocument();
    expect(screen.getByText("Conta Casa")).toBeInTheDocument();
    expect(screen.queryByText("Reserva Invest")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.getByText("Fatura Visa Casa")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar lancamento" })[0]!);
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Salario ajustado");
    await user.click(screen.getByRole("button", { name: "Salvar edicao" }));

    expect(screen.getByText("Salario ajustado")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar lancamento" })[0]!);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.queryByText("Salario ajustado")).not.toBeInTheDocument();
  });

  it("creates, edits and deletes investment as linked transfer pair", async () => {
    const user = userEvent.setup();
    render(React.createElement(CashflowPage));

    await user.click(screen.getByRole("button", { name: "Novo lancamento" }));
    await user.click(screen.getByRole("tab", { name: "Investimento" }));
    await user.type(screen.getByLabelText("Descricao da transacao"), "Aporte");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "300.00");
    await user.click(screen.getByRole("button", { name: "Adicionar lancamento" }));
    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled();

    expect(await screen.findAllByText("Aporte")).toHaveLength(1);
    expect(screen.getAllByText(/Investimento/).length).toBeGreaterThan(0);
    expect(screen.queryByText("Saida")).not.toBeInTheDocument();
    expect(screen.getByText("Conta Casa -> Reserva Invest")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Editar lancamento" })[0]!);
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Aporte ajustado");
    await user.clear(screen.getByLabelText("Editar valor da transacao"));
    await user.type(screen.getByLabelText("Editar valor da transacao"), "450.00");
    await user.click(screen.getByRole("button", { name: "Salvar edicao" }));

    expect(screen.getAllByText("Aporte ajustado")).toHaveLength(1);

    await user.click(screen.getAllByRole("button", { name: "Editar lancamento" })[0]!);
    await user.click(screen.getByRole("button", { name: "Excluir" }));
    expect(screen.queryByText("Aporte ajustado")).not.toBeInTheDocument();
  });

  it("does not add investment opening balance to the current month balance card", async () => {
    const user = userEvent.setup();
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
    accounts.createAccount({ householdId, name: "Reserva Invest", type: "INVESTMENT", openingBalance: "700.00", goalAmount: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });

    render(React.createElement(CashflowPage));

    expect(screen.getByTestId("current-real-balance")).toHaveTextContent("R$ 1.000,00");

    await user.click(screen.getByRole("button", { name: "Abrir composicao do saldo atual" }));
    expect(screen.getByText("Conta Casa")).toBeInTheDocument();
    expect(screen.queryByText("Reserva Invest")).not.toBeInTheDocument();
    expect(screen.getByText("Saldo atual em contas")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.000,00")).toBeInTheDocument();
  });

  it("edits recurring entries only for the selected month", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();

    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    const account = accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    const category = categories.createCategory({ householdId, name: "Mercado" });

    const engine = new ScheduleEngineService();
    const scheduleManagement = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
    );

    scheduleManagement.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Academia",
      amount: "100.00",
      startMonth: "2026-03",
      categoryId: category.id,
      accountId: account.id,
    });

    render(React.createElement(CashflowPage));

    expect(screen.getByText("Academia")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Editar lancamento" })[0]!);
    expect(screen.getByLabelText("Escopo da edicao recorrente")).toHaveValue("THIS_ONLY");
    expect(screen.getByText("Esta edicao altera apenas esta ocorrencia da recorrencia.")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Academia promocional");
    await user.clear(screen.getByLabelText("Editar valor da transacao"));
    await user.type(screen.getByLabelText("Editar valor da transacao"), "150.00");
    await user.click(screen.getByRole("button", { name: "Salvar edicao" }));

    expect(screen.getByText("Academia promocional")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ir para proximo mes" }));
    expect(screen.queryByText("Academia promocional")).not.toBeInTheDocument();
    expect(screen.getByText("Academia")).toBeInTheDocument();
  });
});
