import { beforeEach, describe, expect, it } from "vitest";

import { AccountAdjustmentsService } from "../../src/modules/accounts/account-adjustments.service";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
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

  it("previews account differences from month-end balances without future paid transactions", () => {
    const checking = accountsService.create({
      householdId,
      name: "Conta Corrente",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const category = categoriesRepo.create({ householdId, name: "Salario", normalized: "salario" });
    transactionsRepo.create({
      householdId,
      kind: "INCOME",
      description: "Salario abril",
      amount: "200.00",
      occurredAt: "2026-04-15T12:00:00.000Z",
      accountId: checking.id,
      creditCardId: null,
      categoryId: category.id,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Despesa futura",
      amount: "300.00",
      occurredAt: "2026-05-01T12:00:00.000Z",
      accountId: checking.id,
      creditCardId: null,
      categoryId: category.id,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });

    const preview = monthCloseService.previewCloseMonth({
      householdId,
      month: "2026-04",
      realAccountBalances: {
        [checking.id]: "1250.00",
      },
    });

    expect(preview.accounts[0]).toMatchObject({
      accountId: checking.id,
      appBalance: "1200.00",
      realBalance: "1250.00",
      difference: "50.00",
      willCreateAdjustment: true,
    });
  });

  it("confirms account adjustments from the month-end difference instead of the current balance", () => {
    const checking = accountsService.create({
      householdId,
      name: "Conta Corrente",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const category = categoriesRepo.create({ householdId, name: "Movimentos", normalized: "movimentos" });
    transactionsRepo.create({
      householdId,
      kind: "INCOME",
      description: "Salario abril",
      amount: "200.00",
      occurredAt: "2026-04-15T12:00:00.000Z",
      accountId: checking.id,
      creditCardId: null,
      categoryId: category.id,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Despesa futura",
      amount: "300.00",
      occurredAt: "2026-05-01T12:00:00.000Z",
      accountId: checking.id,
      creditCardId: null,
      categoryId: category.id,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });

    const result = monthCloseService.confirmCloseMonth({
      householdId,
      month: "2026-04",
      realAccountBalances: {
        [checking.id]: "1250.00",
      },
    });

    expect(result.applied.accountAdjustments[0].result).toMatchObject({
      previousBalance: "1200.00",
      realBalance: "1250.00",
      difference: "50.00",
    });
    expect(result.applied.accountAdjustments[0].result.transaction).toMatchObject({
      kind: "INCOME",
      amount: "50.00",
      accountId: checking.id,
      occurredAt: "2026-04-30T12:00:00.000Z",
    });
  });
});
