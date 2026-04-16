// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CardsPage from "../../src/app/foundation/cards/page";
import { SnackbarProvider } from "../../src/components/ui/snackbar";
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
import { InvoiceSettlementRepository } from "../../src/modules/invoices/invoice-settlement.repository";
import { TransactionsController } from "../../src/modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const householdId = "household-main";

describe("cards flow", () => {
  afterEach(() => {
    cleanup();
    sessionStorage.clear();
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-04-15T12:00:00.000Z"));

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
    new InvoiceSettlementRepository().clearAll();

    const accounts = new AccountsController(new AccountsService(accountsRepo));
    const cards = new CardsController(new CardsService(cardsRepo));
    const categories = new CategoriesController(new CategoriesService(categoriesRepo));

    accounts.createAccount({ householdId, name: "Conta Casa", type: "CHECKING", openingBalance: "1000.00" });
    cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    categories.createCategory({ householdId, name: "Mercado" });
  });

  it("opens on the current month and selects the unpaid invoice first", async () => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const settlementsRepo = new InvoiceSettlementRepository();

    const account = new AccountsController(new AccountsService(accountsRepo)).listAccounts(householdId)[0]!;
    const cards = new CardsController(new CardsService(cardsRepo));
    const paidCard = cards.listCards(householdId)[0]!;
    const unpaidCard = cards.createCard({ householdId, name: "Master Casa", closeDay: 5, dueDay: 12 });
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;
    const transactions = new TransactionsController(new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo));

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra paga",
      amount: "50.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      creditCardId: paidCard.id,
      categoryId: category.id,
    });
    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra aberta",
      amount: "90.00",
      occurredAt: "2026-04-02T12:00:00.000Z",
      creditCardId: unpaidCard.id,
      categoryId: category.id,
    });
    settlementsRepo.upsert({
      householdId,
      cardId: paidCard.id,
      dueMonth: "2026-04",
      paymentAccountId: account.id,
      paidAt: "2026-04-10T12:00:00.000Z",
      paidAmount: "50.00",
    });

    render(React.createElement(CardsPage));

    expect(screen.getByText("Faturas do mes 2026-04")).toBeInTheDocument();
    expect(await screen.findByText("Detalhe da fatura: Master Casa")).toBeInTheDocument();
  });

  it("falls back to the first invoice when all current month invoices are paid", async () => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const settlementsRepo = new InvoiceSettlementRepository();

    const account = new AccountsController(new AccountsService(accountsRepo)).listAccounts(householdId)[0]!;
    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;
    const transactions = new TransactionsController(new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo));

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra paga",
      amount: "50.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });
    settlementsRepo.upsert({
      householdId,
      cardId: card.id,
      dueMonth: "2026-04",
      paymentAccountId: account.id,
      paidAt: "2026-04-10T12:00:00.000Z",
      paidAmount: "50.00",
    });

    render(React.createElement(CardsPage));

    expect(screen.getByText("Faturas do mes 2026-04")).toBeInTheDocument();
    expect(await screen.findByText("Detalhe da fatura: Visa Casa")).toBeInTheDocument();
  });

  it("edits recurring invoice entries only for the selected occurrence", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const scheduleRepo = new ScheduleRepository();

    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;

    const engine = new ScheduleEngineService();
    const scheduleManagement = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
    );

    const rule = scheduleManagement.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Streaming",
      amount: "90.00",
      startMonth: "2026-04",
      categoryId: category.id,
      creditCardId: card.id,
    });

    render(React.createElement(CardsPage));

    expect(await screen.findByText(/Streaming/)).toBeInTheDocument();
    await user.click(screen.getByText(/Streaming/));
    expect(screen.getByLabelText("Escopo da edicao recorrente")).toHaveValue("THIS_ONLY");
    expect(screen.getByText("Esta edicao altera apenas esta ocorrencia da recorrencia.")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Editar descricao da transacao"));
    await user.type(screen.getByLabelText("Editar descricao da transacao"), "Streaming promo");
    await user.clear(screen.getByLabelText("Editar valor da transacao"));
    await user.type(screen.getByLabelText("Editar valor da transacao"), "120.00");
    await user.click(screen.getByRole("button", { name: "Salvar edicao" }));

    expect(await screen.findByText(/Streaming promo/)).toBeInTheDocument();
    expect(scheduleRepo.findInstanceBySourceMonth("RECURRING", rule.id, "2026-04")?.amount).toBe("120.00");
    expect(scheduleRepo.findInstanceBySourceMonth("RECURRING", rule.id, "2026-05")?.amount).toBe("90.00");
    expect(scheduleRepo.findRecurringRuleById(rule.id)?.active).toBe(true);
  });

  it("shows newest card transactions first", async () => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();

    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;
    const transactions = new TransactionsController(new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo));

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra antiga",
      amount: "50.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });
    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra recente",
      amount: "90.00",
      occurredAt: "2026-04-04T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    render(React.createElement(CardsPage));

    const recentRow = await screen.findByText("Compra recente");
    const olderRow = screen.getByText("Compra antiga");
    const relation = recentRow.compareDocumentPosition(olderRow);
    expect(relation & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("groups invoice entries by source and shows launch and registration dates", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();

    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;
    const transactions = new TransactionsController(new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo));
    const engine = new ScheduleEngineService();
    const scheduleManagement = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
    );

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra avulsa",
      amount: "50.00",
      occurredAt: "2026-04-02T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });
    scheduleManagement.createInstallmentSchedule({
      householdId,
      description: "Notebook",
      totalAmount: "300.00",
      installmentsCount: 3,
      startMonth: "2026-02",
      categoryId: category.id,
      creditCardId: card.id,
    });
    scheduleManagement.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Streaming",
      amount: "90.00",
      startMonth: "2026-04",
      categoryId: category.id,
      creditCardId: card.id,
    });

    render(React.createElement(CardsPage));

    const latestHeader = await screen.findByText("Ultimos lancamentos");
    const installmentsHeader = screen.getByText("Parcelamentos");
    const recurringHeader = screen.getByText("Recorrencias");

    expect(screen.getByText("Lancado em")).toBeInTheDocument();
    expect(screen.getByText("Registrado em")).toBeInTheDocument();
    expect(installmentsHeader.compareDocumentPosition(latestHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(latestHeader.compareDocumentPosition(recurringHeader) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(screen.getByText("Compra avulsa"));
    expect(screen.getByText("Editar item da fatura")).toBeInTheDocument();
    expect(screen.getByLabelText("Editar data da transacao")).toHaveValue("2026-04-02");
  });

  it("adds a new expense directly to the selected card", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();

    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;
    const transactions = new TransactionsController(new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo));

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra base",
      amount: "50.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    render(React.createElement(CardsPage));

    await user.click(screen.getByRole("button", { name: "Adicionar despesa" }));
    expect(screen.getByLabelText("Tipo da transacao")).toHaveValue("EXPENSE");
    expect(screen.getByLabelText("Destino da transacao")).toHaveValue("card");
    expect(screen.getByLabelText("Opcao de destino")).toHaveValue(card.id);
    await user.type(screen.getByLabelText("Descricao da transacao"), "Compra rapida");
    await user.clear(screen.getByLabelText("Valor da transacao"));
    await user.type(screen.getByLabelText("Valor da transacao"), "120.00");
    await user.click(screen.getByRole("button", { name: "Adicionar despesa" }));

    expect(await screen.findByText("Compra rapida")).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*170[,.]00/).length).toBeGreaterThan(0);
  });

  it("adjusts a card invoice to the real invoice total", async () => {
    const user = userEvent.setup();
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();

    const card = new CardsController(new CardsService(cardsRepo)).listCards(householdId)[0]!;
    const category = new CategoriesController(new CategoriesService(categoriesRepo)).listCategories(householdId)[0]!;
    const transactions = new TransactionsController(new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo));

    transactions.createTransaction({
      householdId,
      kind: "EXPENSE",
      description: "Compra base",
      amount: "100.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      creditCardId: card.id,
      categoryId: category.id,
    });

    render(React.createElement(SnackbarProvider, null, React.createElement(CardsPage)));

    await user.click(await screen.findByRole("button", { name: `Reajustar fatura ${card.name}` }));
    expect(screen.getByText("Reajustar fatura")).toBeInTheDocument();
    expect(screen.getByText(`${card.name} - Abr/26`)).toBeInTheDocument();
    expect(screen.getByText(/Total atual no app/)).toHaveTextContent(/R\$\s*100[,.]00/);

    await user.clear(screen.getByLabelText("Valor real da fatura"));
    await user.type(screen.getByLabelText("Valor real da fatura"), "13500");
    await user.clear(screen.getByLabelText("Data do reajuste"));
    await user.type(screen.getByLabelText("Data do reajuste"), "2026-04-15");
    await user.click(screen.getByRole("button", { name: "Salvar reajuste" }));

    expect(await screen.findByText("Reajuste de fatura lancado com sucesso.")).toBeInTheDocument();
    expect(screen.getAllByText(/R\$\s*135[,.]00/).length).toBeGreaterThan(0);
    expect(await screen.findByText("REAJUSTE")).toBeInTheDocument();

    const adjustment = transactions
      .listTransactionsByMonth({ householdId, month: "2026-04", creditCardId: card.id })
      .find((item) => item.description === "REAJUSTE");

    expect(adjustment).toMatchObject({
      householdId,
      kind: "EXPENSE",
      amount: "35.00",
      creditCardId: card.id,
      invoiceMonthKey: "2026-04",
      settlementStatus: null,
    });
  });
});
