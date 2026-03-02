import { z } from "zod";

import { Account } from "../../domain/accounts/account.entity";
import { sumMoney } from "../../domain/shared/money";
import { AccountsRepository } from "./accounts.repository";

const accountInputSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["CHECKING", "SAVINGS", "CASH"]),
  openingBalance: z.string().min(1),
});

export interface CreateAccountInput {
  householdId: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CASH";
  openingBalance: string;
}

export class AccountsService {
  constructor(private readonly repository: AccountsRepository) {}

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

  consolidatedBalance(householdId: string): { amount: string } {
    const values = this.list(householdId).map((item) => item.openingBalance);
    return { amount: sumMoney(values) };
  }

  clearAll() {
    this.repository.clearAll();
  }
}
