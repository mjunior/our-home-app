export interface CreditCardProps {
  id?: string;
  householdId: string;
  name: string;
  closeDay: number;
  dueDay: number;
}

function assertDayRange(value: number, fieldName: string): void {
  if (!Number.isInteger(value) || value < 1 || value > 31) {
    throw new Error(`${fieldName} must be an integer between 1 and 31`);
  }
}

export class CreditCard {
  readonly id?: string;
  readonly householdId: string;
  readonly name: string;
  readonly closeDay: number;
  readonly dueDay: number;

  constructor(props: CreditCardProps) {
    const name = props.name.trim();

    if (!props.householdId.trim()) {
      throw new Error("householdId is required");
    }

    if (!name) {
      throw new Error("card name is required");
    }

    assertDayRange(props.closeDay, "closeDay");
    assertDayRange(props.dueDay, "dueDay");

    this.id = props.id;
    this.householdId = props.householdId.trim();
    this.name = name;
    this.closeDay = props.closeDay;
    this.dueDay = props.dueDay;
  }
}
