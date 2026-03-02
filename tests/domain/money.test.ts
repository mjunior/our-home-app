import { describe, expect, it } from "vitest";

import { Category, normalizeCategoryName } from "../../src/domain/categories/category.entity";
import { CreditCard } from "../../src/domain/cards/credit-card.entity";
import { Money, sumMoney } from "../../src/domain/shared/money";

describe("money", () => {
  it("handles decimal-safe aggregation", () => {
    expect(sumMoney(["0.10", "0.20", "1.00"])).toBe("1.30");
  });

  it("supports add and subtract with precision", () => {
    const current = new Money("10.35");
    const result = current.add(new Money("0.10")).subtract(new Money("0.05"));

    expect(result.toFixed()).toBe("10.40");
  });
});

describe("category normalization", () => {
  it("normalizes case and spaces", () => {
    expect(normalizeCategoryName("  Mercado   Casa ")).toBe("mercado casa");

    const category = new Category({ householdId: "home-1", name: "  MERCADO  " });
    expect(category.normalized).toBe("mercado");
  });
});

describe("credit card day validation", () => {
  it("rejects invalid billing cycle days", () => {
    expect(
      () => new CreditCard({ householdId: "home-1", name: "Nubank", closeDay: 0, dueDay: 12 }),
    ).toThrow("closeDay must be an integer between 1 and 31");
  });
});
