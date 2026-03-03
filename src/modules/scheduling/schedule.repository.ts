import { createId } from "../../domain/shared/id";

export type ScheduleSourceType = "INSTALLMENT" | "RECURRING";

export interface InstallmentPlanRecord {
  id: string;
  householdId: string;
  description: string;
  totalAmount: string;
  installmentsCount: number;
  startMonth: string;
  categoryId: string;
  accountId: string | null;
  creditCardId: string | null;
  active: boolean;
  createdAt: string;
}

export interface RecurringRuleRecord {
  id: string;
  householdId: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  startMonth: string;
  categoryId: string;
  accountId: string | null;
  creditCardId: string | null;
  active: boolean;
  revisionOfRuleId: string | null;
  createdAt: string;
}

export interface ScheduledInstanceRecord {
  id: string;
  householdId: string;
  sourceType: ScheduleSourceType;
  sourceId: string;
  sequence: number;
  monthKey: string;
  occurredAt: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  categoryId: string;
  accountId: string | null;
  creditCardId: string | null;
  instanceKey: string;
  locked: boolean;
}

const installmentPlansStore: InstallmentPlanRecord[] = [];
const recurringRulesStore: RecurringRuleRecord[] = [];
const scheduledInstancesStore: ScheduledInstanceRecord[] = [];

export class ScheduleRepository {
  createInstallmentPlan(data: Omit<InstallmentPlanRecord, "id">): InstallmentPlanRecord {
    const record: InstallmentPlanRecord = { id: createId(), ...data };
    installmentPlansStore.push(record);
    return record;
  }

  createRecurringRule(data: Omit<RecurringRuleRecord, "id">): RecurringRuleRecord {
    const record: RecurringRuleRecord = { id: createId(), ...data };
    recurringRulesStore.push(record);
    return record;
  }

  listInstallmentPlans(householdId: string): InstallmentPlanRecord[] {
    return installmentPlansStore.filter((plan) => plan.householdId === householdId);
  }

  listRecurringRules(householdId: string): RecurringRuleRecord[] {
    return recurringRulesStore.filter((rule) => rule.householdId === householdId);
  }

  findInstallmentPlanById(id: string): InstallmentPlanRecord | undefined {
    return installmentPlansStore.find((plan) => plan.id === id);
  }

  findRecurringRuleById(id: string): RecurringRuleRecord | undefined {
    return recurringRulesStore.find((rule) => rule.id === id);
  }

  updateRecurringRule(id: string, patch: Partial<RecurringRuleRecord>): RecurringRuleRecord {
    const target = this.findRecurringRuleById(id);
    if (!target) {
      throw new Error("RECURRING_RULE_NOT_FOUND");
    }

    Object.assign(target, patch);
    return target;
  }

  updateInstallmentPlan(id: string, patch: Partial<InstallmentPlanRecord>): InstallmentPlanRecord {
    const target = this.findInstallmentPlanById(id);
    if (!target) {
      throw new Error("INSTALLMENT_PLAN_NOT_FOUND");
    }

    Object.assign(target, patch);
    return target;
  }

  createInstanceIfMissing(data: Omit<ScheduledInstanceRecord, "id">): { created: boolean; record: ScheduledInstanceRecord } {
    const existing = scheduledInstancesStore.find((instance) => instance.instanceKey === data.instanceKey);
    if (existing) {
      return { created: false, record: existing };
    }

    const created: ScheduledInstanceRecord = { id: createId(), ...data };
    scheduledInstancesStore.push(created);
    return { created: true, record: created };
  }

  listInstancesBySource(sourceType: ScheduleSourceType, sourceId: string): ScheduledInstanceRecord[] {
    return scheduledInstancesStore.filter((instance) => instance.sourceType === sourceType && instance.sourceId === sourceId);
  }

  updateScheduledInstance(id: string, patch: Partial<ScheduledInstanceRecord>): ScheduledInstanceRecord {
    const target = scheduledInstancesStore.find((item) => item.id === id);
    if (!target) {
      throw new Error("SCHEDULE_INSTANCE_NOT_FOUND");
    }

    Object.assign(target, patch);
    return target;
  }

  listInstancesByHousehold(householdId: string): ScheduledInstanceRecord[] {
    return scheduledInstancesStore.filter((instance) => instance.householdId === householdId);
  }

  removeFutureInstances(sourceType: ScheduleSourceType, sourceId: string, fromMonth: string): void {
    for (let index = scheduledInstancesStore.length - 1; index >= 0; index -= 1) {
      const item = scheduledInstancesStore[index];
      if (item.sourceType === sourceType && item.sourceId === sourceId && item.monthKey >= fromMonth) {
        scheduledInstancesStore.splice(index, 1);
      }
    }
  }

  removeInstancesBySource(sourceType: ScheduleSourceType, sourceId: string, includeLocked: boolean): void {
    for (let index = scheduledInstancesStore.length - 1; index >= 0; index -= 1) {
      const item = scheduledInstancesStore[index];
      if (item.sourceType !== sourceType || item.sourceId !== sourceId) {
        continue;
      }
      if (!includeLocked && item.locked) {
        continue;
      }
      scheduledInstancesStore.splice(index, 1);
    }
  }

  lockInstancesBeforeMonth(sourceType: ScheduleSourceType, sourceId: string, effectiveMonth: string): void {
    for (const item of scheduledInstancesStore) {
      if (item.sourceType === sourceType && item.sourceId === sourceId && item.monthKey < effectiveMonth) {
        item.locked = true;
      }
    }
  }

  removeRecurringRule(id: string): void {
    for (let index = recurringRulesStore.length - 1; index >= 0; index -= 1) {
      if (recurringRulesStore[index]?.id === id) {
        recurringRulesStore.splice(index, 1);
      }
    }
  }

  removeInstallmentPlan(id: string): void {
    for (let index = installmentPlansStore.length - 1; index >= 0; index -= 1) {
      if (installmentPlansStore[index]?.id === id) {
        installmentPlansStore.splice(index, 1);
      }
    }
  }

  clearAll(): void {
    installmentPlansStore.length = 0;
    recurringRulesStore.length = 0;
    scheduledInstancesStore.length = 0;
  }
}
