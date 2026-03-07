import { describe, expect, it } from "vitest";

import { InvoiceCycleService } from "../../src/modules/invoices/invoice-cycle.service";

describe("invoice cycle service", () => {
  const cycle = new InvoiceCycleService();

  it("keeps purchase before close day in current cycle", () => {
    const result = cycle.resolveExpenseCycle("2026-03-04T10:00:00.000Z", 5, 12);
    expect(result.monthKey).toBe("2026-03");
  });

  it("moves purchase after close day to next cycle", () => {
    const result = cycle.resolveExpenseCycle("2026-03-06T10:00:00.000Z", 5, 12);
    expect(result.monthKey).toBe("2026-04");
  });

  it("moves purchase on close day to next cycle", () => {
    const result = cycle.resolveExpenseCycle("2026-03-05T10:00:00.000Z", 5, 10);
    expect(result).toEqual({
      monthKey: "2026-04",
      dueDate: "2026-04-10T00:00:00.000Z",
    });
  });
});
