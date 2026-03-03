import { Money, type MoneyInput } from "../shared/money";

export type AccountType = "CHECKING" | "INVESTMENT";

export interface AccountProps {
  id?: string;
  householdId: string;
  name: string;
  type: AccountType;
  openingBalance: MoneyInput;
}

export class Account {
  readonly id?: string;
  readonly householdId: string;
  readonly name: string;
  readonly type: AccountType;
  readonly openingBalance: Money;

  constructor(props: AccountProps) {
    const name = props.name.trim();

    if (!props.householdId.trim()) {
      throw new Error("householdId is required");
    }

    if (!name) {
      throw new Error("account name is required");
    }

    this.id = props.id;
    this.householdId = props.householdId.trim();
    this.name = name;
    this.type = props.type;
    this.openingBalance = new Money(props.openingBalance);
  }
}
