import { randomUUID } from "node:crypto";

export interface AccountRecord {
  id: string;
  householdId: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CASH";
  openingBalance: string;
}

const accountsStore: AccountRecord[] = [];

export class AccountsRepository {
  create(data: Omit<AccountRecord, "id">): AccountRecord {
    const record: AccountRecord = {
      id: randomUUID(),
      ...data,
    };

    accountsStore.push(record);
    return record;
  }

  listByHousehold(householdId: string): AccountRecord[] {
    return accountsStore.filter((account) => account.householdId === householdId);
  }

  clearAll(): void {
    accountsStore.length = 0;
  }
}
