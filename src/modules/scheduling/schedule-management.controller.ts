import type { CreateInvestmentTransferInput, CreateTransactionInput } from "../transactions/transactions.service";
import type { CreateInstallmentInput } from "./installments.service";
import type { CreateRecurringInput } from "./recurrence.service";
import { ScheduleManagementService } from "./schedule-management.service";

export class ScheduleManagementController {
  constructor(private readonly service: ScheduleManagementService) {}

  createInstallmentSchedule(payload: CreateInstallmentInput) {
    return this.service.createInstallmentSchedule(payload);
  }

  createRecurringSchedule(payload: CreateRecurringInput) {
    return this.service.createRecurringSchedule(payload);
  }

  createLaunch(
    payload:
      | { launchType: "ONE_OFF"; transaction: CreateTransactionInput }
      | { launchType: "RECURRING"; recurring: CreateRecurringInput }
      | { launchType: "INSTALLMENT"; installment: CreateInstallmentInput }
      | { launchType: "INVESTMENT"; investment: CreateInvestmentTransferInput },
  ) {
    return this.service.createUnifiedLaunch(payload);
  }

  createLaunchBatch(
    payload: {
      entries: Array<
        | { launchType: "ONE_OFF"; transaction: CreateTransactionInput }
        | { launchType: "RECURRING"; recurring: CreateRecurringInput }
        | { launchType: "INSTALLMENT"; installment: CreateInstallmentInput }
        | { launchType: "INVESTMENT"; investment: CreateInvestmentTransferInput }
      >;
    },
  ) {
    return this.service.createLaunchBatch(payload);
  }

  editRecurringSchedule(payload: {
    ruleId: string;
    effectiveMonth: string;
    kind?: "INCOME" | "EXPENSE";
    amount?: string;
    description?: string;
  }) {
    return this.service.editRecurringSchedule(payload);
  }

  editInstallmentSchedule(payload: {
    planId: string;
    effectiveMonth: string;
    kind?: "INCOME" | "EXPENSE";
    amount?: string;
    description?: string;
  }) {
    return this.service.editInstallmentSchedule(payload);
  }

  deleteRecurringSchedule(payload: { ruleId: string; fromMonth: string; scope: "CURRENT_AND_FUTURE" | "ALL" }) {
    return this.service.deleteRecurringSchedule(payload);
  }

  deleteInstallmentSchedule(payload: { planId: string; fromMonth: string; scope: "CURRENT_AND_FUTURE" | "ALL" }) {
    return this.service.deleteInstallmentSchedule(payload);
  }

  stopRecurringSchedule(payload: { ruleId: string; stopFromMonth: string }) {
    return this.service.stopRecurringSchedule(payload);
  }

  listSchedules(householdId: string) {
    return this.service.listSchedules(householdId);
  }

  listMonthInstances(payload: { householdId: string; month: string }) {
    return this.service.listMonthInstances(payload.householdId, payload.month);
  }

  updateInstanceSettlement(payload: { instanceId: string; settlementStatus: "PAID" | "UNPAID" }) {
    return this.service.updateInstanceSettlement(payload);
  }
}
