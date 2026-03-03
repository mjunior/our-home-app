import { createId } from "../../domain/shared/id";

export type TransactionKind = "INCOME" | "EXPENSE";

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
  create(data: Omit<TransactionRecord, "id">): TransactionRecord {
    const record: TransactionRecord = {
      id: createId(),
      ...data,
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

  clearAll(): void {
    transactionsStore.length = 0;
  }
}
