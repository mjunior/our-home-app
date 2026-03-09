import { AccountsService, type CreateAccountInput, type UpdateAccountGoalInput } from "./accounts.service";

export class AccountsController {
  constructor(private readonly service: AccountsService) {}

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
}
