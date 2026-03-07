import { z } from "zod";

import { ScheduleEngineService } from "./schedule-engine.service";
import { ScheduleRepository, type RecurringRuleRecord } from "./schedule.repository";

const recurrenceSchema = z.object({
  householdId: z.string().min(1),
  kind: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1),
  amount: z.string().min(1),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().min(1),
  accountId: z.string().min(1).optional(),
  creditCardId: z.string().min(1).optional(),
});

export interface CreateRecurringInput {
  householdId: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  startMonth: string;
  categoryId: string;
  accountId?: string;
  creditCardId?: string;
}

export class RecurrenceService {
  constructor(
    private readonly repository: ScheduleRepository,
    private readonly engine: ScheduleEngineService,
  ) {}

  createRule(input: CreateRecurringInput, revisionOfRuleId?: string): RecurringRuleRecord {
    const parsed = recurrenceSchema.parse(input);

    if ((parsed.accountId && parsed.creditCardId) || (!parsed.accountId && !parsed.creditCardId)) {
      throw new Error("RECURRING_REQUIRES_SINGLE_TARGET");
    }

    if (parsed.kind === "INCOME" && parsed.creditCardId) {
      throw new Error("INCOME_REQUIRES_ACCOUNT_ONLY");
    }

    return this.repository.createRecurringRule({
      householdId: parsed.householdId,
      kind: parsed.kind,
      description: parsed.description,
      amount: parsed.amount,
      startMonth: parsed.startMonth,
      categoryId: parsed.categoryId,
      accountId: parsed.accountId ?? null,
      creditCardId: parsed.creditCardId ?? null,
      active: true,
      revisionOfRuleId: revisionOfRuleId ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  generateByWindow(ruleId: string, fromMonth: string, toMonth: string): void {
    const rule = this.repository.findRecurringRuleById(ruleId);
    if (!rule) {
      throw new Error("RECURRING_RULE_NOT_FOUND");
    }

    if (!rule.active) {
      return;
    }

    const start = fromMonth > rule.startMonth ? fromMonth : rule.startMonth;
    const months = this.engine.iterateMonths(start, toMonth);

    for (let index = 0; index < months.length; index += 1) {
      const monthKey = months[index];
      const sequence = index + 1;
      const instanceKey = this.engine.buildInstanceKey("RECURRING", rule.id, sequence, monthKey);

      this.repository.createInstanceIfMissing({
        householdId: rule.householdId,
        sourceType: "RECURRING",
        sourceId: rule.id,
        sequence,
        monthKey,
        occurredAt: this.engine.toOccurredAt(monthKey),
        kind: rule.kind,
        description: rule.description,
        amount: rule.amount,
        categoryId: rule.categoryId,
        accountId: rule.accountId,
        creditCardId: rule.creditCardId,
        instanceKey,
        locked: false,
        settlementStatus: rule.accountId ? "UNPAID" : null,
      });
    }
  }
}
