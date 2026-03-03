import { z } from "zod";

import { ScheduleEngineService } from "./schedule-engine.service";
import { ScheduleRepository } from "./schedule.repository";

const installmentSchema = z.object({
  householdId: z.string().min(1),
  description: z.string().min(1),
  totalAmount: z.string().min(1),
  installmentsCount: z.number().int().min(2),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/),
  categoryId: z.string().min(1),
  accountId: z.string().min(1).optional(),
  creditCardId: z.string().min(1).optional(),
});

export interface CreateInstallmentInput {
  householdId: string;
  description: string;
  totalAmount: string;
  installmentsCount: number;
  startMonth: string;
  categoryId: string;
  accountId?: string;
  creditCardId?: string;
}

export class InstallmentsService {
  constructor(
    private readonly repository: ScheduleRepository,
    private readonly engine: ScheduleEngineService,
  ) {}

  createPlanAndGenerate(input: CreateInstallmentInput) {
    const parsed = installmentSchema.parse(input);

    if ((parsed.accountId && parsed.creditCardId) || (!parsed.accountId && !parsed.creditCardId)) {
      throw new Error("INSTALLMENT_REQUIRES_SINGLE_TARGET");
    }

    const plan = this.repository.createInstallmentPlan({
      householdId: parsed.householdId,
      description: parsed.description,
      totalAmount: parsed.totalAmount,
      installmentsCount: parsed.installmentsCount,
      startMonth: parsed.startMonth,
      categoryId: parsed.categoryId,
      accountId: parsed.accountId ?? null,
      creditCardId: parsed.creditCardId ?? null,
      active: true,
      createdAt: new Date().toISOString(),
    });

    this.generateInstallments(plan.id);

    return plan;
  }

  generateInstallments(planId: string): void {
    const plan = this.repository.findInstallmentPlanById(planId);
    if (!plan) {
      throw new Error("INSTALLMENT_PLAN_NOT_FOUND");
    }

    const splits = this.engine.splitInstallments(plan.totalAmount, plan.installmentsCount);

    for (let index = 0; index < plan.installmentsCount; index += 1) {
      const sequence = index + 1;
      const monthKey = this.engine.addMonths(plan.startMonth, index);
      const instanceKey = this.engine.buildInstanceKey("INSTALLMENT", plan.id, sequence, monthKey);

      this.repository.createInstanceIfMissing({
        householdId: plan.householdId,
        sourceType: "INSTALLMENT",
        sourceId: plan.id,
        sequence,
        monthKey,
        occurredAt: this.engine.toOccurredAt(monthKey),
        kind: "EXPENSE",
        description: `${plan.description} (${sequence}/${plan.installmentsCount})`,
        amount: splits[index],
        categoryId: plan.categoryId,
        accountId: plan.accountId,
        creditCardId: plan.creditCardId,
        instanceKey,
        locked: false,
      });
    }
  }
}
