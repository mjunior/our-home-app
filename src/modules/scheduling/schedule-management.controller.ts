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

  editRecurringSchedule(payload: { ruleId: string; effectiveMonth: string; amount?: string; description?: string }) {
    return this.service.editRecurringSchedule(payload);
  }

  stopRecurringSchedule(payload: { ruleId: string; stopFromMonth: string }) {
    return this.service.stopRecurringSchedule(payload);
  }

  listSchedules(householdId: string) {
    return this.service.listSchedules(householdId);
  }
}
