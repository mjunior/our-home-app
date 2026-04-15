import { beforeEach, describe, expect, it } from "vitest";

import { AccountAdjustmentsService } from "../../src/modules/accounts/account-adjustments.service";
import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";
const otherHouseholdId = "household-other";

const accountsRepo = new AccountsRepository();
const categoriesRepo = new CategoriesRepository();
const transactionsRepo = new TransactionsRepository();
const accountsService = new AccountsService(accountsRepo, transactionsRepo);
const adjustmentsService = new AccountAdjustmentsService(accountsService, transactionsRepo, categoriesRepo);

describe("account adjustments", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
  });

  it("returns an account balance snapshot using the same paid account movements as consolidated balance", () => {
    const account = accountsService.create({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });

    transactionsRepo.create({
      householdId,
      kind: "INCOME",
      description: "Salario",
      amount: "500.00",
      occurredAt: "2026-04-01T12:00:00.000Z",
      accountId: account.id,
      creditCardId: null,
      categoryId: "category-income",
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });
    transactionsRepo.create({
      householdId,
      kind: "EXPENSE",
      description: "Conta aberta",
      amount: "120.00",
      occurredAt: "2026-04-02T12:00:00.000Z",
      accountId: account.id,
      creditCardId: null,
      categoryId: "category-expense",
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "UNPAID",
      transferGroupId: null,
    });

    const snapshot = accountsService.getAccountBalanceSnapshot({
      householdId,
      accountId: account.id,
    });
    const consolidatedAccount = accountsService
      .consolidatedBalance(householdId)
      .accounts.find((item) => item.id === account.id);

    expect(snapshot.account.id).toBe(account.id);
    expect(snapshot.balance).toBe("1500.00");
    expect(snapshot.balance).toBe(consolidatedAccount?.balance);
  });

  it("rejects balance snapshot access for accounts outside the household", () => {
    const account = accountsService.create({
      householdId: otherHouseholdId,
      name: "Conta de outra casa",
      type: "CHECKING",
      openingBalance: "250.00",
    });

    expect(() =>
      accountsService.getAccountBalanceSnapshot({
        householdId,
        accountId: account.id,
      }),
    ).toThrow("ACCOUNT_NOT_FOUND");
  });

  it("creates a paid income adjustment when real balance is greater than current balance", () => {
    const account = accountsService.create({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });

    const result = adjustmentsService.createAccountAdjustment({
      householdId,
      accountId: account.id,
      realBalance: "1250.75",
      month: "2026-04",
      occurredAt: "2026-04-15T12:00:00.000Z",
    });

    expect(result.previousBalance).toBe("1000.00");
    expect(result.realBalance).toBe("1250.75");
    expect(result.difference).toBe("250.75");
    expect(result.transaction).toMatchObject({
      householdId,
      kind: "INCOME",
      description: "REAJUSTE",
      amount: "250.75",
      occurredAt: "2026-04-15T12:00:00.000Z",
      accountId: account.id,
      creditCardId: null,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });
    expect(categoriesRepo.listByHousehold(householdId)).toMatchObject([{ name: "Reajuste", normalized: "reajuste" }]);
  });

  it("creates a paid expense adjustment when real balance is lower than current balance and reuses the system category", () => {
    const account = accountsService.create({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const existingCategory = categoriesRepo.create({
      householdId,
      name: "Reajuste",
      normalized: "reajuste",
    });

    const result = adjustmentsService.createAccountAdjustment({
      householdId,
      accountId: account.id,
      realBalance: "900.25",
      month: "2026-04",
      occurredAt: "2026-04-20T12:00:00.000Z",
    });

    expect(result.previousBalance).toBe("1000.00");
    expect(result.realBalance).toBe("900.25");
    expect(result.difference).toBe("-99.75");
    expect(result.transaction).toMatchObject({
      householdId,
      kind: "EXPENSE",
      description: "REAJUSTE",
      amount: "99.75",
      accountId: account.id,
      categoryId: existingCategory.id,
      settlementStatus: "PAID",
    });
    expect(categoriesRepo.listByHousehold(householdId)).toHaveLength(1);
  });

  it("rejects adjustment dates outside the informed competence month", () => {
    const account = accountsService.create({
      householdId,
      name: "Conta Principal",
      type: "CHECKING",
      openingBalance: "1000.00",
    });

    expect(() =>
      adjustmentsService.createAccountAdjustment({
        householdId,
        accountId: account.id,
        realBalance: "900.25",
        month: "2026-04",
        occurredAt: "2026-05-01T12:00:00.000Z",
      }),
    ).toThrow("ACCOUNT_ADJUSTMENT_MONTH_MISMATCH");
    expect(transactionsRepo.listByHousehold(householdId)).toHaveLength(0);
  });

  it("rejects adjustments for accounts outside the household without creating transactions", () => {
    const account = accountsService.create({
      householdId: otherHouseholdId,
      name: "Conta de outra casa",
      type: "CHECKING",
      openingBalance: "250.00",
    });

    expect(() =>
      adjustmentsService.createAccountAdjustment({
        householdId,
        accountId: account.id,
        realBalance: "900.25",
        month: "2026-04",
        occurredAt: "2026-04-20T12:00:00.000Z",
      }),
    ).toThrow("ACCOUNT_NOT_FOUND");
    expect(transactionsRepo.listByHousehold(householdId)).toHaveLength(0);
    expect(transactionsRepo.listByHousehold(otherHouseholdId)).toHaveLength(0);
  });
});
