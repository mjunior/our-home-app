import { z } from "zod";

import { Account } from "../../domain/accounts/account.entity";
import { sumMoney } from "../../domain/shared/money";
import { AccountsRepository } from "./accounts.repository";
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
});

export interface CreateAccountInput {
  householdId: string;
  name: string;
  type: "CHECKING" | "INVESTMENT";
  openingBalance: string;
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
    });
  }

  list(householdId: string) {
    return this.repository.listByHousehold(householdId);
  }

  consolidatedBalance(householdId: string): {
    amount: string;
    byType: { CHECKING: string; INVESTMENT: string };
    accounts: Array<{ id: string; name: string; type: "CHECKING" | "INVESTMENT"; balance: string }>;
  } {
    const accounts = this.list(householdId);
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

    const accountRows = accounts.map((item) => {
      const opening = Number(item.openingBalance);
      const movement = netByAccountId.get(item.id) ?? 0;
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        balance: (opening + movement).toFixed(2),
      };
    });

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
