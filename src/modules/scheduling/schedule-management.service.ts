import { z } from "zod";

import {
  TransactionsService,
  type CreateInvestmentTransferInput,
  type CreateTransactionInput,
} from "../transactions/transactions.service";
import { InstallmentsService, type CreateInstallmentInput } from "./installments.service";
import { RecurrenceService, type CreateRecurringInput } from "./recurrence.service";
import { ScheduleEngineService } from "./schedule-engine.service";
import { ScheduleRepository } from "./schedule.repository";

const editRecurringSchema = z.object({
  ruleId: z.string().min(1),
  effectiveMonth: z.string().regex(/^\d{4}-\d{2}$/),
  kind: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const stopRecurringSchema = z.object({
  ruleId: z.string().min(1),
  stopFromMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

const editInstallmentSchema = z.object({
  planId: z.string().min(1),
  effectiveMonth: z.string().regex(/^\d{4}-\d{2}$/),
  kind: z.enum(["INCOME", "EXPENSE"]).optional(),
  amount: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const deleteRecurringSchema = z.object({
  ruleId: z.string().min(1),
  fromMonth: z.string().regex(/^\d{4}-\d{2}$/),
  scope: z.enum(["CURRENT_AND_FUTURE", "ALL"]),
});

const deleteInstallmentSchema = z.object({
  planId: z.string().min(1),
  fromMonth: z.string().regex(/^\d{4}-\d{2}$/),
  scope: z.enum(["CURRENT_AND_FUTURE", "ALL"]),
});

const unifiedLaunchSchema = z.discriminatedUnion("launchType", [
  z.object({
    launchType: z.literal("ONE_OFF"),
    transaction: z.object({
      householdId: z.string().min(1),
      kind: z.enum(["INCOME", "EXPENSE"]),
      description: z.string().min(1),
      amount: z.string().min(1),
      occurredAt: z.string().datetime(),
      categoryId: z.string().min(1),
      accountId: z.string().min(1).optional(),
      creditCardId: z.string().min(1).optional(),
    }),
  }),
  z.object({
    launchType: z.literal("RECURRING"),
    recurring: z.object({
      householdId: z.string().min(1),
      kind: z.enum(["INCOME", "EXPENSE"]),
      description: z.string().min(1),
      amount: z.string().min(1),
      startMonth: z.string().regex(/^\d{4}-\d{2}$/),
      categoryId: z.string().min(1),
      accountId: z.string().min(1).optional(),
      creditCardId: z.string().min(1).optional(),
    }),
  }),
  z.object({
    launchType: z.literal("INSTALLMENT"),
    installment: z.object({
      householdId: z.string().min(1),
      description: z.string().min(1),
      totalAmount: z.string().min(1),
      installmentsCount: z.number().int().min(2),
      startMonth: z.string().regex(/^\d{4}-\d{2}$/),
      categoryId: z.string().min(1),
      accountId: z.string().min(1).optional(),
      creditCardId: z.string().min(1).optional(),
    }),
  }),
  z.object({
    launchType: z.literal("INVESTMENT"),
    investment: z.object({
      householdId: z.string().min(1),
      description: z.string().min(1),
      amount: z.string().min(1),
      occurredAt: z.string().datetime(),
      categoryId: z.string().min(1),
      sourceAccountId: z.string().min(1),
      destinationAccountId: z.string().min(1),
    }),
  }),
]);

type UnifiedLaunchInput =
  | { launchType: "ONE_OFF"; transaction: CreateTransactionInput }
  | { launchType: "RECURRING"; recurring: CreateRecurringInput }
  | { launchType: "INSTALLMENT"; installment: CreateInstallmentInput }
  | { launchType: "INVESTMENT"; investment: CreateInvestmentTransferInput };

const launchBatchSchema = z.object({
  entries: z.array(unifiedLaunchSchema).min(1),
});

export interface LaunchBatchResult {
  total: number;
  created: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

export class ScheduleManagementService {
  constructor(
    private readonly repository: ScheduleRepository,
    private readonly installmentsService: InstallmentsService,
    private readonly recurrenceService: RecurrenceService,
    private readonly engine: ScheduleEngineService,
    private readonly transactionsService?: TransactionsService,
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

  createUnifiedLaunch(input: UnifiedLaunchInput) {
    const parsed = unifiedLaunchSchema.parse(input);

    if (parsed.launchType === "ONE_OFF") {
      if (!this.transactionsService) {
        throw new Error("TRANSACTION_SERVICE_NOT_CONFIGURED");
      }
      return this.transactionsService.create(parsed.transaction);
    }

    if (parsed.launchType === "RECURRING") {
      return this.createRecurringSchedule(parsed.recurring);
    }

    if (parsed.launchType === "INVESTMENT") {
      if (!this.transactionsService) {
        throw new Error("TRANSACTION_SERVICE_NOT_CONFIGURED");
      }
      return this.transactionsService.createInvestmentTransfer(parsed.investment);
    }

    return this.createInstallmentSchedule(parsed.installment);
  }

  createLaunchBatch(input: { entries: UnifiedLaunchInput[] }): LaunchBatchResult {
    const parsed = launchBatchSchema.parse(input);

    const errors: Array<{ index: number; error: string }> = [];
    let created = 0;

    parsed.entries.forEach((entry, index) => {
      try {
        this.createUnifiedLaunch(entry);
        created += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
        errors.push({ index, error: message });
      }
    });

    return {
      total: parsed.entries.length,
      created,
      failed: parsed.entries.length - created,
      errors,
    };
  }

  editRecurringSchedule(input: { ruleId: string; effectiveMonth: string; kind?: "INCOME" | "EXPENSE"; amount?: string; description?: string }) {
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
        kind: parsed.kind ?? rule.kind,
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

  editInstallmentSchedule(input: {
    planId: string;
    effectiveMonth: string;
    kind?: "INCOME" | "EXPENSE";
    amount?: string;
    description?: string;
  }) {
    const parsed = editInstallmentSchema.parse(input);
    const plan = this.repository.findInstallmentPlanById(parsed.planId);
    if (!plan) {
      throw new Error("INSTALLMENT_PLAN_NOT_FOUND");
    }

    const instances = this.repository
      .listInstancesBySource("INSTALLMENT", plan.id)
      .filter((item) => item.monthKey >= parsed.effectiveMonth && !item.locked);

    for (const instance of instances) {
      this.repository.updateScheduledInstance(instance.id, {
        kind: parsed.kind ?? instance.kind,
        amount: parsed.amount ?? instance.amount,
        description: parsed.description ? `${parsed.description} (${instance.sequence}/${plan.installmentsCount})` : instance.description,
      });
    }

    if (parsed.description) {
      this.repository.updateInstallmentPlan(plan.id, { description: parsed.description });
    }

    if (parsed.amount) {
      const allInstances = this.repository.listInstancesBySource("INSTALLMENT", plan.id);
      const total = allInstances.reduce((acc, item) => acc + Number(item.amount), 0);
      this.repository.updateInstallmentPlan(plan.id, { totalAmount: total.toFixed(2) });
    }

    return this.repository.findInstallmentPlanById(plan.id)!;
  }

  deleteRecurringSchedule(input: { ruleId: string; fromMonth: string; scope: "CURRENT_AND_FUTURE" | "ALL" }) {
    const parsed = deleteRecurringSchema.parse(input);
    const rule = this.repository.findRecurringRuleById(parsed.ruleId);
    if (!rule) {
      throw new Error("RECURRING_RULE_NOT_FOUND");
    }

    if (parsed.scope === "ALL") {
      this.repository.removeInstancesBySource("RECURRING", rule.id, true);
      this.repository.removeRecurringRule(rule.id);
      return { deleted: true, scope: parsed.scope };
    }

    this.repository.lockInstancesBeforeMonth("RECURRING", rule.id, parsed.fromMonth);
    this.repository.removeFutureInstances("RECURRING", rule.id, parsed.fromMonth);
    this.repository.updateRecurringRule(rule.id, { active: false });
    return { deleted: true, scope: parsed.scope };
  }

  deleteInstallmentSchedule(input: { planId: string; fromMonth: string; scope: "CURRENT_AND_FUTURE" | "ALL" }) {
    const parsed = deleteInstallmentSchema.parse(input);
    const plan = this.repository.findInstallmentPlanById(parsed.planId);
    if (!plan) {
      throw new Error("INSTALLMENT_PLAN_NOT_FOUND");
    }

    if (parsed.scope === "ALL") {
      this.repository.removeInstancesBySource("INSTALLMENT", plan.id, true);
      this.repository.removeInstallmentPlan(plan.id);
      return { deleted: true, scope: parsed.scope };
    }

    this.repository.lockInstancesBeforeMonth("INSTALLMENT", plan.id, parsed.fromMonth);
    this.repository.removeFutureInstances("INSTALLMENT", plan.id, parsed.fromMonth);
    this.repository.updateInstallmentPlan(plan.id, { active: false });
    return { deleted: true, scope: parsed.scope };
  }

  listSchedules(householdId: string) {
    return {
      installments: this.repository.listInstallmentPlans(householdId),
      recurrences: this.repository.listRecurringRules(householdId),
      instances: this.repository.listInstancesByHousehold(householdId).sort((a, b) => a.monthKey.localeCompare(b.monthKey)),
    };
  }

  listMonthInstances(householdId: string, month: string) {
    return this.repository
      .listInstancesByHousehold(householdId)
      .filter((item) => item.monthKey === month)
      .sort((a, b) => a.sequence - b.sequence);
  }
}
