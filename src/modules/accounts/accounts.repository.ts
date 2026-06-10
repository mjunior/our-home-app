import { createId } from "../../domain/shared/id";

export interface AccountRecord {
  id: string;
  householdId: string;
  name: string;
  type: "CHECKING" | "INVESTMENT";
  openingBalance: string;
  balanceAdjustment: string;
  goalAmount: string | null;
}

const accountsStore: AccountRecord[] = [];

type CreateAccountData = Omit<AccountRecord, "id" | "goalAmount" | "balanceAdjustment"> &
  Partial<Pick<AccountRecord, "goalAmount" | "balanceAdjustment">>;

export class AccountsRepository {
  create(data: CreateAccountData): AccountRecord {
    const record: AccountRecord = {
      id: createId(),
      balanceAdjustment: "0.00",
      goalAmount: null,
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
