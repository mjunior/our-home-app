import { beforeEach, describe, expect, it } from "vitest";

import { AccountAdjustmentsService } from "../../src/modules/accounts/account-adjustments.service";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CardsService } from "../../src/modules/cards/cards.service";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { CreditCardAdjustmentsService } from "../../src/modules/invoices/credit-card-adjustments.service";
import { InvoiceCycleService } from "../../src/modules/invoices/invoice-cycle.service";
import { InvoicesService } from "../../src/modules/invoices/invoices.service";
import { MonthCloseService } from "../../src/modules/month-close/month-close.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";

const accountsRepo = new AccountsRepository();
const cardsRepo = new CardsRepository();
const categoriesRepo = new CategoriesRepository();
const transactionsRepo = new TransactionsRepository();
const scheduleRepo = new ScheduleRepository();
const accountsService = new AccountsService(accountsRepo, transactionsRepo);
const cardsService = new CardsService(cardsRepo);
const invoicesService = new InvoicesService(transactionsRepo, cardsRepo, new InvoiceCycleService(), scheduleRepo);
const accountAdjustmentsService = new AccountAdjustmentsService(accountsService, transactionsRepo, categoriesRepo);
const creditCardAdjustmentsService = new CreditCardAdjustmentsService(invoicesService, transactionsRepo, categoriesRepo);
const monthCloseService = new MonthCloseService(
  accountsService,
  invoicesService,
  accountAdjustmentsService,
  creditCardAdjustmentsService,
);

describe("month close service", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();
  });

  it("previews only checking accounts with signed differences and zero rows marked as no-op", () => {
    const checking = accountsService.create({
      householdId,
      name: "Conta Corrente",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const emergencyFund = accountsService.create({
      householdId,
      name: "Reserva",
      type: "INVESTMENT",
      openingBalance: "5000.00",
      goalAmount: "10000.00",
    });
    const zeroChecking = accountsService.create({
      householdId,
      name: "Conta Sem Diferenca",
      type: "CHECKING",
      openingBalance: "50.00",
    });

    const preview = monthCloseService.previewCloseMonth({
      householdId,
      month: "2026-04",
      realAccountBalances: {
        [checking.id]: "975.25",
        [emergencyFund.id]: "1.00",
        [zeroChecking.id]: "50.00",
      },
    });

    expect(preview.month).toBe("2026-04");
    expect(preview.adjustmentDate).toBe("2026-04-30T12:00:00.000Z");
    expect(preview.accounts).toEqual([
      {
        accountId: checking.id,
        accountName: "Conta Corrente",
        appBalance: "1000.00",
        realBalance: "975.25",
        difference: "-24.75",
        willCreateAdjustment: true,
      },
      {
        accountId: zeroChecking.id,
        accountName: "Conta Sem Diferenca",
        appBalance: "50.00",
        realBalance: "50.00",
        difference: "0.00",
        willCreateAdjustment: false,
      },
    ]);
  });

  it("previews card invoices due in the close month with positive and negative differences", () => {
    const aprilCard = cardsService.create({ householdId, name: "Visa", closeDay: 5, dueDay: 12 });
    const mayCard = cardsService.create({ householdId, name: "Master", closeDay: 5, dueDay: 12 });
    const category = categoriesRepo.create({ householdId, name: "Compras", normalized: "compras" });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra abril",
      amount: "100.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      accountId: null,
      creditCardId: aprilCard.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-04",
      invoiceDueDate: "2026-04-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra maio",
      amount: "75.00",
      occurredAt: "2026-05-01T12:00:00.000Z",
      accountId: null,
      creditCardId: mayCard.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-05",
      invoiceDueDate: "2026-05-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });

    const preview = monthCloseService.previewCloseMonth({
      householdId,
      month: "2026-04",
      realCardInvoiceTotals: {
        [aprilCard.id]: "120.00",
        [mayCard.id]: "1.00",
      },
    });

    expect(preview.cardInvoices).toEqual([
      {
        cardId: aprilCard.id,
        cardName: "Visa",
        appTotal: "100.00",
        realTotal: "120.00",
        difference: "20.00",
        willCreateAdjustment: true,
      },
    ]);

    const negativePreview = monthCloseService.previewCloseMonth({
      householdId,
      month: "2026-04",
      realCardInvoiceTotals: {
        [aprilCard.id]: "80.00",
      },
    });

    expect(negativePreview.cardInvoices[0]).toMatchObject({
      appTotal: "100.00",
      realTotal: "80.00",
      difference: "-20.00",
      willCreateAdjustment: true,
    });
  });

  it("confirms the preview and applies only non-zero account and card invoice rows", () => {
    const checking = accountsService.create({
      householdId,
      name: "Conta Corrente",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const zeroChecking = accountsService.create({
      householdId,
      name: "Conta Sem Diferenca",
      type: "CHECKING",
      openingBalance: "50.00",
    });
    const card = cardsService.create({ householdId, name: "Visa", closeDay: 5, dueDay: 12 });
    const category = categoriesRepo.create({ householdId, name: "Compras", normalized: "compras" });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra",
      amount: "100.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-04",
      invoiceDueDate: "2026-04-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });

    const result = monthCloseService.confirmCloseMonth({
      householdId,
      month: "2026-04",
      realAccountBalances: {
        [checking.id]: "1100.00",
        [zeroChecking.id]: "50.00",
      },
      realCardInvoiceTotals: {
        [card.id]: "100.00",
      },
    });

    expect(result.preview.accounts.map((row) => [row.accountId, row.willCreateAdjustment])).toEqual([
      [checking.id, true],
      [zeroChecking.id, false],
    ]);
    expect(result.preview.cardInvoices[0]).toMatchObject({
      cardId: card.id,
      difference: "0.00",
      willCreateAdjustment: false,
    });
    expect(result.applied.accountAdjustments).toHaveLength(1);
    expect(result.applied.cardInvoiceAdjustments).toHaveLength(0);
    expect(result.applied.accountAdjustments[0].result.transaction).toMatchObject({
      householdId,
      kind: "INCOME",
      amount: "100.00",
      occurredAt: "2026-04-30T12:00:00.000Z",
      accountId: checking.id,
    });
    expect(transactionsRepo.listByHousehold(householdId).filter((item) => item.description === "REAJUSTE")).toHaveLength(1);
  });
});
