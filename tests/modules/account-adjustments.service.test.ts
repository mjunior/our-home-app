import { beforeEach, describe, expect, it } from "vitest";

import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { AccountsService } from "../../src/modules/accounts/accounts.service";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";

const householdId = "household-main";
const otherHouseholdId = "household-other";

const accountsRepo = new AccountsRepository();
const transactionsRepo = new TransactionsRepository();
const accountsService = new AccountsService(accountsRepo, transactionsRepo);

describe("account adjustments", () => {
  beforeEach(() => {
    accountsRepo.clearAll();
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
});
