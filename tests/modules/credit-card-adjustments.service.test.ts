import { beforeEach, describe, expect, it } from "vitest";

import { CardsController } from "../../src/modules/cards/cards.controller";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CardsService } from "../../src/modules/cards/cards.service";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { CreditCardAdjustmentsService } from "../../src/modules/invoices/credit-card-adjustments.service";
import { InvoiceCycleService } from "../../src/modules/invoices/invoice-cycle.service";
import { InvoicesController } from "../../src/modules/invoices/invoices.controller";
import { InvoicesService } from "../../src/modules/invoices/invoices.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";
const otherHouseholdId = "household-other";

const cardsRepo = new CardsRepository();
const categoriesRepo = new CategoriesRepository();
const transactionsRepo = new TransactionsRepository();
const scheduleRepo = new ScheduleRepository();
const cards = new CardsController(new CardsService(cardsRepo));
const invoicesService = new InvoicesService(transactionsRepo, cardsRepo, new InvoiceCycleService(), scheduleRepo);
const adjustmentsService = new CreditCardAdjustmentsService(invoicesService, transactionsRepo, categoriesRepo);
const invoices = new InvoicesController(invoicesService, adjustmentsService);

describe("credit card adjustments", () => {
  beforeEach(() => {
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();
  });

  it("creates a positive invoice adjustment when real invoice total is greater than the current total", () => {
    const card = cards.createCard({ householdId, name: "Visa Casa", closeDay: 5, dueDay: 12 });
    const category = categoriesRepo.create({ householdId, name: "Mercado", normalized: "mercado" });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra",
      amount: "100.00",
      occurredAt: "2026-03-01T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-03",
      invoiceDueDate: "2026-03-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });

    const result = adjustmentsService.createCreditCardAdjustment({
      householdId,
      cardId: card.id,
      realInvoiceTotal: "135.00",
      dueMonth: "2026-03",
      occurredAt: "2026-03-15T12:00:00.000Z",
    });

    expect(result.previousInvoiceTotal).toBe("100.00");
    expect(result.realInvoiceTotal).toBe("135.00");
    expect(result.difference).toBe("35.00");
    expect(result.transaction).toMatchObject({
      householdId,
      kind: "EXPENSE",
      description: "REAJUSTE",
      amount: "35.00",
      occurredAt: "2026-03-15T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      invoiceMonthKey: "2026-03",
      invoiceDueDate: "2026-03-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });
    expect(categoriesRepo.listByHousehold(householdId)).toMatchObject([
      { name: "Mercado", normalized: "mercado" },
      { name: "Reajuste", normalized: "reajuste" },
    ]);
    expect(invoicesService.getCardInvoiceEntriesByDueMonth({ householdId, cardId: card.id, dueMonth: "2026-03" }).total).toBe("135.00");
  });

  it("creates a negative invoice adjustment when real invoice total is lower and reuses the system category", () => {
    const card = cards.createCard({ householdId, name: "Master", closeDay: 5, dueDay: 10 });
    const purchaseCategory = categoriesRepo.create({ householdId, name: "Compras", normalized: "compras" });
    const adjustmentCategory = categoriesRepo.create({ householdId, name: "Reajuste", normalized: "reajuste" });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra",
      amount: "200.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: purchaseCategory.id,
      invoiceMonthKey: "2026-04",
      invoiceDueDate: "2026-04-10T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });

    const result = adjustmentsService.createCreditCardAdjustment({
      householdId,
      cardId: card.id,
      realInvoiceTotal: "175.50",
      dueMonth: "2026-04",
      occurredAt: "2026-04-15T12:00:00.000Z",
    });

    expect(result.previousInvoiceTotal).toBe("200.00");
    expect(result.realInvoiceTotal).toBe("175.50");
    expect(result.difference).toBe("-24.50");
    expect(result.transaction).toMatchObject({
      kind: "EXPENSE",
      description: "REAJUSTE",
      amount: "-24.50",
      creditCardId: card.id,
      categoryId: adjustmentCategory.id,
      invoiceMonthKey: "2026-04",
      settlementStatus: null,
    });
    expect(categoriesRepo.listByHousehold(householdId)).toHaveLength(2);
    expect(invoicesService.getCardInvoiceEntriesByDueMonth({ householdId, cardId: card.id, dueMonth: "2026-04" }).total).toBe("175.50");
  });

  it("rejects adjustments for cards outside the household without creating transactions", () => {
    const card = cards.createCard({ householdId: otherHouseholdId, name: "Outro Cartao", closeDay: 5, dueDay: 12 });

    expect(() =>
      adjustmentsService.createCreditCardAdjustment({
        householdId,
        cardId: card.id,
        realInvoiceTotal: "135.00",
        dueMonth: "2026-03",
        occurredAt: "2026-03-15T12:00:00.000Z",
      }),
    ).toThrow("CARD_NOT_FOUND");
    expect(transactionsRepo.listByHousehold(householdId)).toHaveLength(0);
    expect(transactionsRepo.listByHousehold(otherHouseholdId)).toHaveLength(0);
  });

  it("delegates credit card adjustment creation through the invoices controller", () => {
    const card = cards.createCard({ householdId, name: "Controller Card", closeDay: 5, dueDay: 12 });
    const category = categoriesRepo.create({ householdId, name: "Compras", normalized: "compras" });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Compra",
      amount: "80.00",
      occurredAt: "2026-05-01T12:00:00.000Z",
      accountId: null,
      creditCardId: card.id,
      categoryId: category.id,
      invoiceMonthKey: "2026-05",
      invoiceDueDate: "2026-05-12T00:00:00.000Z",
      settlementStatus: null,
      transferGroupId: null,
    });

    const result = invoices.createCreditCardAdjustment({
      householdId,
      cardId: card.id,
      realInvoiceTotal: "95.00",
      dueMonth: "2026-05",
      occurredAt: "2026-05-15T12:00:00.000Z",
    });

    expect(result.previousInvoiceTotal).toBe("80.00");
    expect(result.realInvoiceTotal).toBe("95.00");
    expect(result.difference).toBe("15.00");
    expect(result.transaction).toMatchObject({
      kind: "EXPENSE",
      description: "REAJUSTE",
      amount: "15.00",
      creditCardId: card.id,
    });
  });

  it("fails clearly when credit card adjustment controller contract is called without the service", () => {
    const controller = new InvoicesController(invoicesService);

    expect(() =>
      controller.createCreditCardAdjustment({
        householdId,
        cardId: "card-id",
        realInvoiceTotal: "95.00",
        dueMonth: "2026-05",
        occurredAt: "2026-05-15T12:00:00.000Z",
      }),
    ).toThrow("CREDIT_CARD_ADJUSTMENT_SERVICE_NOT_CONFIGURED");
  });
});
