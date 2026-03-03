import { createId } from "../../domain/shared/id";

export interface AccountRecord {
  id: string;
  householdId: string;
  name: string;
  type: "CHECKING" | "INVESTMENT";
  openingBalance: string;
}

const accountsStore: AccountRecord[] = [];

export class AccountsRepository {
  create(data: Omit<AccountRecord, "id">): AccountRecord {
    const record: AccountRecord = {
      id: createId(),
      ...data,
    };

    accountsStore.push(record);
    return record;
  }

  listByHousehold(householdId: string): AccountRecord[] {
    return accountsStore.filter((account) => account.householdId === householdId);
  }

  findById(id: string): AccountRecord | undefined {
    return accountsStore.find((account) => account.id === id);
  }

  clearAll(): void {
    accountsStore.length = 0;
  }
}
