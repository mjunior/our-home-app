import { createId } from "../../domain/shared/id";

export type TransactionKind = "INCOME" | "EXPENSE";
export type SettlementStatus = "PAID" | "UNPAID";

export interface TransactionRecord {
  id: string;
  householdId: string;
  kind: TransactionKind;
  description: string;
  amount: string;
  occurredAt: string;
  accountId: string | null;
  creditCardId: string | null;
  categoryId: string;
  invoiceMonthKey: string | null;
  invoiceDueDate: string | null;
  settlementStatus: SettlementStatus | null;
  transferGroupId: string | null;
  createdAt: string;
}

export interface TransactionMonthFilter {
  month: string;
  accountId?: string;
  creditCardId?: string;
  categoryId?: string;
}

const transactionsStore: TransactionRecord[] = [];

function toMonthKey(occurredAt: string): string {
  return occurredAt.slice(0, 7);
}

export class TransactionsRepository {
  create(data: Omit<TransactionRecord, "id" | "createdAt"> & { createdAt?: string }): TransactionRecord {
    const record: TransactionRecord = {
      id: createId(),
      ...data,
      createdAt: data.createdAt ?? new Date().toISOString(),
    };

    transactionsStore.push(record);
    return record;
  }

  listByHouseholdMonth(householdId: string, filter: TransactionMonthFilter): TransactionRecord[] {
    return transactionsStore.filter((transaction) => {
      if (transaction.householdId !== householdId) {
        return false;
      }

      if (toMonthKey(transaction.occurredAt) !== filter.month) {
        return false;
      }

      if (filter.accountId && transaction.accountId !== filter.accountId) {
        return false;
      }

      if (filter.creditCardId && transaction.creditCardId !== filter.creditCardId) {
        return false;
      }

      if (filter.categoryId && transaction.categoryId !== filter.categoryId) {
        return false;
      }

      return true;
    });
  }

  listByHousehold(householdId: string): TransactionRecord[] {
    return transactionsStore.filter((transaction) => transaction.householdId === householdId);
  }

  findById(id: string): TransactionRecord | undefined {
    return transactionsStore.find((transaction) => transaction.id === id);
  }

  listByTransferGroupId(householdId: string, transferGroupId: string): TransactionRecord[] {
    return transactionsStore.filter((transaction) => transaction.householdId === householdId && transaction.transferGroupId === transferGroupId);
  }

  update(id: string, patch: Partial<Omit<TransactionRecord, "id" | "householdId">>): TransactionRecord {
    const target = this.findById(id);
    if (!target) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }

    Object.assign(target, patch);
    return target;
  }

  remove(id: string): void {
    for (let index = transactionsStore.length - 1; index >= 0; index -= 1) {
      if (transactionsStore[index]?.id === id) {
        transactionsStore.splice(index, 1);
      }
    }
  }

  removeByTransferGroupId(householdId: string, transferGroupId: string): void {
    for (let index = transactionsStore.length - 1; index >= 0; index -= 1) {
      const item = transactionsStore[index];
      if (!item) continue;
      if (item.householdId === householdId && item.transferGroupId === transferGroupId) {
        transactionsStore.splice(index, 1);
      }
    }
  }

  removeByCreditCardId(householdId: string, creditCardId: string): void {
    for (let index = transactionsStore.length - 1; index >= 0; index -= 1) {
      const item = transactionsStore[index];
      if (!item) continue;
      if (item.householdId === householdId && item.creditCardId === creditCardId) {
        transactionsStore.splice(index, 1);
      }
    }
  }

  clearAll(): void {
    transactionsStore.length = 0;
  }
}
