import { describe, expect, it } from "vitest";

import { InstallmentsService } from "../../src/modules/scheduling/installments.service";
import { RecurrenceService } from "../../src/modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../src/modules/scheduling/schedule-engine.service";
import { ScheduleManagementService } from "../../src/modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";

const householdId = "household-main";

describe("schedule management", () => {
  it("edits recurrence from effective month without changing historical instances", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Academia",
      amount: "100.00",
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    management.editRecurringSchedule({
      ruleId: rule.id,
      effectiveMonth: "2026-06",
      amount: "150.00",
    });

    const allRules = repository.listRecurringRules(householdId);
    expect(allRules.filter((item) => item.active)).toHaveLength(1);

    const oldInstances = repository.listInstancesBySource("RECURRING", rule.id);
    expect(oldInstances.every((item) => item.monthKey < "2026-06")).toBe(true);
    expect(oldInstances.every((item) => item.amount === "100.00")).toBe(true);

    const activeRule = allRules.find((item) => item.active)!;
    const newInstances = repository.listInstancesBySource("RECURRING", activeRule.id);
    expect(newInstances[0].monthKey).toBe("2026-06");
    expect(newInstances[0].amount).toBe("150.00");
  });

  it("stops recurrence from target month forward", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Streaming",
      amount: "50.00",
      startMonth: "2026-03",
      categoryId: "cat-2",
      accountId: "acc-1",
    });

    management.stopRecurringSchedule({ ruleId: rule.id, stopFromMonth: "2026-07" });

    const instances = repository.listInstancesBySource("RECURRING", rule.id);
    expect(instances.every((item) => item.monthKey < "2026-07")).toBe(true);

    const stoppedRule = repository.findRecurringRuleById(rule.id)!;
    expect(stoppedRule.active).toBe(false);
  });
});
