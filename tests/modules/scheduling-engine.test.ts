import { describe, expect, it } from "vitest";

import { InstallmentsService } from "../../src/modules/scheduling/installments.service";
import { RecurrenceService } from "../../src/modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../src/modules/scheduling/schedule-engine.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";

const householdId = "household-main";

describe("scheduling engine", () => {
  it("splits installments with exact amount sum and deterministic months", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const installments = new InstallmentsService(repository, new ScheduleEngineService());

    const plan = installments.createPlanAndGenerate({
      householdId,
      description: "Notebook",
      totalAmount: "1000.00",
      installmentsCount: 3,
      startMonth: "2026-04",
      categoryId: "cat-1",
      creditCardId: "card-1",
    });

    const instances = repository.listInstancesBySource("INSTALLMENT", plan.id);
    expect(instances).toHaveLength(3);
    expect(instances.map((item) => item.monthKey)).toEqual(["2026-04", "2026-05", "2026-06"]);

    const total = instances.reduce((acc, item) => acc + Number(item.amount), 0);
    expect(total.toFixed(2)).toBe("1000.00");
  });

  it("generates recurring entries idempotently for same window", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const recurrence = new RecurrenceService(repository, new ScheduleEngineService());

    const rule = recurrence.createRule({
      householdId,
      kind: "EXPENSE",
      description: "Internet",
      amount: "120.00",
      startMonth: "2026-03",
      categoryId: "cat-2",
      accountId: "acc-1",
    });

    recurrence.generateByWindow(rule.id, "2026-03", "2026-05");
    recurrence.generateByWindow(rule.id, "2026-03", "2026-05");

    const instances = repository.listInstancesBySource("RECURRING", rule.id);
    expect(instances).toHaveLength(3);
    expect(instances.map((item) => item.monthKey)).toEqual(["2026-03", "2026-04", "2026-05"]);
  });
});
