import { z } from "zod";

import { InstallmentsService, type CreateInstallmentInput } from "./installments.service";
import { RecurrenceService, type CreateRecurringInput } from "./recurrence.service";
import { ScheduleEngineService } from "./schedule-engine.service";
import { ScheduleRepository } from "./schedule.repository";

const editRecurringSchema = z.object({
  ruleId: z.string().min(1),
  effectiveMonth: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const stopRecurringSchema = z.object({
  ruleId: z.string().min(1),
  stopFromMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

export class ScheduleManagementService {
  constructor(
    private readonly repository: ScheduleRepository,
    private readonly installmentsService: InstallmentsService,
    private readonly recurrenceService: RecurrenceService,
    private readonly engine: ScheduleEngineService,
  ) {}

  createInstallmentSchedule(input: CreateInstallmentInput) {
    return this.installmentsService.createPlanAndGenerate(input);
  }

  createRecurringSchedule(input: CreateRecurringInput) {
    const rule = this.recurrenceService.createRule(input);
    const endMonth = this.engine.addMonths(input.startMonth, 11);
    this.recurrenceService.generateByWindow(rule.id, input.startMonth, endMonth);
    return rule;
  }

  editRecurringSchedule(input: { ruleId: string; effectiveMonth: string; amount?: string; description?: string }) {
    const parsed = editRecurringSchema.parse(input);
    const rule = this.repository.findRecurringRuleById(parsed.ruleId);

    if (!rule) {
      throw new Error("RECURRING_RULE_NOT_FOUND");
    }

    this.repository.lockInstancesBeforeMonth("RECURRING", rule.id, parsed.effectiveMonth);
    this.repository.removeFutureInstances("RECURRING", rule.id, parsed.effectiveMonth);
    this.repository.updateRecurringRule(rule.id, { active: false });

    const revisedRule = this.recurrenceService.createRule(
      {
        householdId: rule.householdId,
        kind: rule.kind,
        description: parsed.description ?? rule.description,
        amount: parsed.amount ?? rule.amount,
        startMonth: parsed.effectiveMonth,
        categoryId: rule.categoryId,
        accountId: rule.accountId ?? undefined,
        creditCardId: rule.creditCardId ?? undefined,
      },
      rule.id,
    );

    const endMonth = this.engine.addMonths(parsed.effectiveMonth, 11);
    this.recurrenceService.generateByWindow(revisedRule.id, parsed.effectiveMonth, endMonth);

    return revisedRule;
  }

  stopRecurringSchedule(input: { ruleId: string; stopFromMonth: string }) {
    const parsed = stopRecurringSchema.parse(input);
    const rule = this.repository.findRecurringRuleById(parsed.ruleId);

    if (!rule) {
      throw new Error("RECURRING_RULE_NOT_FOUND");
    }

    this.repository.lockInstancesBeforeMonth("RECURRING", rule.id, parsed.stopFromMonth);
    this.repository.removeFutureInstances("RECURRING", rule.id, parsed.stopFromMonth);
    this.repository.updateRecurringRule(rule.id, { active: false });

    return { stopped: true };
  }

  listSchedules(householdId: string) {
    return {
      installments: this.repository.listInstallmentPlans(householdId),
      recurrences: this.repository.listRecurringRules(householdId),
      instances: this.repository.listInstancesByHousehold(householdId).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    };
  }
}
