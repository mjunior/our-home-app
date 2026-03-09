import { createId } from "../../domain/shared/id";

export interface AccountRecord {
  id: string;
  householdId: string;
  name: string;
  type: "CHECKING" | "INVESTMENT";
  openingBalance: string;
  goalAmount: string | null;
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

  update(id: string, patch: Partial<Omit<AccountRecord, "id" | "householdId">>): AccountRecord {
    const account = this.findById(id);
    if (!account) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }

    Object.assign(account, patch);
    return account;
  }

  clearAll(): void {
    accountsStore.length = 0;
  }
}
