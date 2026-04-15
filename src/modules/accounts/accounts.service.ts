import { z } from "zod";

import { Account } from "../../domain/accounts/account.entity";
import { type AccountRecord, AccountsRepository } from "./accounts.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";

interface InvoiceSettlementLike {
  householdId: string;
  paymentAccountId: string;
  paidAmount: string;
  paidAt: string;
}
interface InvoiceSettlementReadRepositoryLike {
  listByHousehold(householdId: string): InvoiceSettlementLike[];
}
interface ScheduledInstanceLike {
  accountId: string | null;
  kind: "INCOME" | "EXPENSE";
  amount: string;
  occurredAt: string;
  settlementStatus: "PAID" | "UNPAID" | null;
}
interface ScheduledInstanceReadRepositoryLike {
  listInstancesByHousehold(householdId: string): ScheduledInstanceLike[];
}

const accountInputSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["CHECKING", "INVESTMENT"]),
  openingBalance: z.string().min(1),
  goalAmount: z.string().min(1).nullable().optional(),
});

const accountGoalUpdateSchema = z.object({
  id: z.string().min(1),
  householdId: z.string().min(1),
  goalAmount: z.string().min(1).nullable(),
});

const accountBalanceSnapshotSchema = z.object({
  householdId: z.string().min(1),
  accountId: z.string().min(1),
});

export interface CreateAccountInput {
  householdId: string;
  name: string;
  type: "CHECKING" | "INVESTMENT";
  openingBalance: string;
  goalAmount?: string | null;
}

export interface UpdateAccountGoalInput {
  id: string;
  householdId: string;
  goalAmount: string | null;
}

export interface GetAccountBalanceSnapshotInput {
  householdId: string;
  accountId: string;
}

interface AccountGoalSnapshot {
  goalAmount: string | null;
  goalProgressPercent: number | null;
  remainingToGoal: string | null;
  goalReached: boolean;
}

interface AccountBalanceRow extends AccountGoalSnapshot {
  id: string;
  name: string;
  type: "CHECKING" | "INVESTMENT";
  balance: string;
}

export interface AccountBalanceSnapshot {
  account: AccountRecord;
  balance: string;
}

function buildAccountGoalSnapshot(input: {
  type: "CHECKING" | "INVESTMENT";
  balance: string;
  goalAmount: string | null;
}): AccountGoalSnapshot {
  if (input.type !== "INVESTMENT" || !input.goalAmount) {
    return {
      goalAmount: null,
      goalProgressPercent: null,
      remainingToGoal: null,
      goalReached: false,
    };
  }

  const balance = Number(input.balance);
  const goalAmount = Number(input.goalAmount);
  const progressRaw = goalAmount <= 0 ? 0 : (balance / goalAmount) * 100;
  const goalProgressPercent = Math.max(0, Math.min(100, Math.round(progressRaw * 100) / 100));
  const remainingToGoal = Math.max(goalAmount - balance, 0).toFixed(2);

  return {
    goalAmount: input.goalAmount,
    goalProgressPercent,
    remainingToGoal,
    goalReached: balance >= goalAmount,
  };
}

export class AccountsService {
  constructor(
    private readonly repository: AccountsRepository,
    private readonly transactionsRepository?: TransactionsRepository,
    private readonly invoiceSettlementRepository?: InvoiceSettlementReadRepositoryLike,
    private readonly scheduledInstanceRepository?: ScheduledInstanceReadRepositoryLike,
  ) {}

  create(input: CreateAccountInput) {
    const parsed = accountInputSchema.parse(input);
    const account = new Account(parsed);

    return this.repository.create({
      householdId: account.householdId,
      name: account.name,
      type: account.type,
      openingBalance: account.openingBalance.toFixed(),
      goalAmount: account.goalAmount?.toFixed() ?? null,
    });
  }

  list(householdId: string) {
    return this.repository.listByHousehold(householdId);
  }

  updateGoal(input: UpdateAccountGoalInput) {
    const parsed = accountGoalUpdateSchema.parse(input);
    const existing = this.repository.findById(parsed.id);
    if (!existing || existing.householdId !== parsed.householdId) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    if (existing.type !== "INVESTMENT") {
      throw new Error("ACCOUNT_GOAL_ONLY_FOR_INVESTMENT");
    }

    const account = new Account({
      id: existing.id,
      householdId: existing.householdId,
      name: existing.name,
      type: existing.type,
      openingBalance: existing.openingBalance,
      goalAmount: parsed.goalAmount,
    });

    return this.repository.update(parsed.id, {
      goalAmount: account.goalAmount?.toFixed() ?? null,
    });
  }

  getAccountBalanceSnapshot(input: GetAccountBalanceSnapshotInput): AccountBalanceSnapshot {
    const parsed = accountBalanceSnapshotSchema.parse(input);
    const account = this.repository.findById(parsed.accountId);
    if (!account || account.householdId !== parsed.householdId) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    const row = this.buildAccountBalanceRows(parsed.householdId).find((item) => item.id === parsed.accountId);
    if (!row) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    return {
      account,
      balance: row.balance,
    };
  }

  private buildNetByAccountId(householdId: string): Map<string, number> {
    const transactions = this.transactionsRepository?.listByHousehold(householdId) ?? [];
    const netByAccountId = new Map<string, number>();

    for (const item of transactions) {
      if (!item.accountId) continue;
      if ((item.settlementStatus ?? "PAID") !== "PAID") continue;
      const signed = item.kind === "INCOME" ? Number(item.amount) : Number(item.amount) * -1;
      netByAccountId.set(item.accountId, (netByAccountId.get(item.accountId) ?? 0) + signed);
    }

    const settlements = this.invoiceSettlementRepository?.listByHousehold(householdId) ?? [];
    for (const settlement of settlements) {
      netByAccountId.set(
        settlement.paymentAccountId,
        (netByAccountId.get(settlement.paymentAccountId) ?? 0) - Number(settlement.paidAmount),
      );
    }

    const scheduledInstances = this.scheduledInstanceRepository?.listInstancesByHousehold(householdId) ?? [];
    for (const instance of scheduledInstances) {
      if (!instance.accountId) continue;
      if ((instance.settlementStatus ?? "PAID") !== "PAID") continue;
      const signed = instance.kind === "INCOME" ? Number(instance.amount) : Number(instance.amount) * -1;
      netByAccountId.set(instance.accountId, (netByAccountId.get(instance.accountId) ?? 0) + signed);
    }

    return netByAccountId;
  }

  private buildAccountBalanceRows(householdId: string): AccountBalanceRow[] {
    const netByAccountId = this.buildNetByAccountId(householdId);

    return this.list(householdId).map((item) => {
      const opening = Number(item.openingBalance);
      const movement = netByAccountId.get(item.id) ?? 0;
      const balance = (opening + movement).toFixed(2);
      const goalSnapshot = buildAccountGoalSnapshot({
        type: item.type,
        balance,
        goalAmount: item.goalAmount ?? null,
      });
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        balance,
        ...goalSnapshot,
      };
    });
  }

  consolidatedBalance(householdId: string): {
    amount: string;
    byType: { CHECKING: string; INVESTMENT: string };
    accounts: Array<{
      id: string;
      name: string;
      type: "CHECKING" | "INVESTMENT";
      balance: string;
      goalAmount: string | null;
      goalProgressPercent: number | null;
      remainingToGoal: string | null;
      goalReached: boolean;
    }>;
  } {
    const accountRows = this.buildAccountBalanceRows(householdId);

    const total = accountRows.reduce((acc, item) => acc + Number(item.balance), 0);
    const checking = accountRows
      .filter((item) => item.type === "CHECKING")
      .reduce((acc, item) => acc + Number(item.balance), 0);
    const investment = accountRows
      .filter((item) => item.type === "INVESTMENT")
      .reduce((acc, item) => acc + Number(item.balance), 0);

    return {
      amount: total.toFixed(2),
      byType: {
        CHECKING: checking.toFixed(2),
        INVESTMENT: investment.toFixed(2),
      },
      accounts: accountRows,
    };
  }

  clearAll() {
    this.repository.clearAll();
  }
}
