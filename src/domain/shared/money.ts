import Decimal from "decimal.js";

export type MoneyInput = Decimal.Value;

export class Money {
  private readonly value: Decimal;

  constructor(value: MoneyInput) {
    this.value = new Decimal(value);
  }

  add(other: Money): Money {
    return new Money(this.value.plus(other.value));
  }

  subtract(other: Money): Money {
    return new Money(this.value.minus(other.value));
  }

  greaterThanOrEqual(other: Money): boolean {
    return this.value.greaterThanOrEqualTo(other.value);
  }

  toFixed(): string {
    return this.value.toFixed(2);
  }

  toDecimal(): Decimal {
    return this.value;
  }
}

export function sumMoney(values: MoneyInput[]): string {
  return values
    .reduce((acc: Decimal, current) => acc.plus(new Decimal(current)), new Decimal(0))
    .toFixed(2);
}
