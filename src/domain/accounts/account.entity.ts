import { Money, type MoneyInput } from "../shared/money";

export type AccountType = "CHECKING" | "INVESTMENT";

export interface AccountProps {
  id?: string;
  householdId: string;
  name: string;
  type: AccountType;
  openingBalance: MoneyInput;
  goalAmount?: MoneyInput | null;
}

export class Account {
  readonly id?: string;
  readonly householdId: string;
  readonly name: string;
  readonly type: AccountType;
  readonly openingBalance: Money;
  readonly goalAmount: Money | null;

  constructor(props: AccountProps) {
    const name = props.name.trim();
    const rawGoalAmount = props.goalAmount;

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
    if (props.type !== "INVESTMENT" && rawGoalAmount != null) {
      throw new Error("goalAmount is only supported for investment accounts");
    }

    if (rawGoalAmount == null) {
      this.goalAmount = null;
      return;
    }

    const goalAmount = new Money(rawGoalAmount);
    if (goalAmount.toDecimal().lessThanOrEqualTo(0)) {
      throw new Error("goalAmount must be greater than zero");
    }

    this.goalAmount = goalAmount;
  }
}
