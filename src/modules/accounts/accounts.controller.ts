import { AccountsService, type CreateAccountInput, type UpdateAccountGoalInput } from "./accounts.service";
import { AccountAdjustmentsService, type CreateAccountAdjustmentInput } from "./account-adjustments.service";

export class AccountsController {
  constructor(
    private readonly service: AccountsService,
    private readonly adjustmentService?: AccountAdjustmentsService,
  ) {}

  createAccount(payload: CreateAccountInput) {
    return this.service.create(payload);
  }

  updateAccountGoal(payload: UpdateAccountGoalInput) {
    return this.service.updateGoal(payload);
  }

  listAccounts(householdId: string) {
    return this.service.list(householdId);
  }

  getConsolidatedBalance(householdId: string) {
    return this.service.consolidatedBalance(householdId);
  }

  createAccountAdjustment(payload: CreateAccountAdjustmentInput) {
    if (!this.adjustmentService) {
      throw new Error("ACCOUNT_ADJUSTMENT_SERVICE_NOT_CONFIGURED");
    }

    return this.adjustmentService.createAccountAdjustment(payload);
  }
}
