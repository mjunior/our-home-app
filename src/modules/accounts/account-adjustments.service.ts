import Decimal from "decimal.js";
import { z } from "zod";

import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsRepository, type TransactionRecord } from "../transactions/transactions.repository";
import { AccountsService } from "./accounts.service";

const accountAdjustmentInputSchema = z.object({
  householdId: z.string().min(1),
  accountId: z.string().min(1),
  realBalance: z.string().min(1),
  comparisonBalance: z.string().min(1).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  occurredAt: z.string().datetime(),
  systemTag: z.enum(["MONTH_CLOSE"]).optional(),
});

export interface CreateAccountAdjustmentInput {
  householdId: string;
  accountId: string;
  realBalance: string;
  comparisonBalance?: string;
  month: string;
  occurredAt: string;
  systemTag?: "MONTH_CLOSE" | null;
}

export interface AccountAdjustmentResult {
  previousBalance: string;
  realBalance: string;
  difference: string;
  transaction: TransactionRecord | null;
}

export class AccountAdjustmentsService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  createAccountAdjustment(input: CreateAccountAdjustmentInput): AccountAdjustmentResult {
    const parsed = accountAdjustmentInputSchema.parse(input);
    if (parsed.occurredAt.slice(0, 7) !== parsed.month) {
      throw new Error("ACCOUNT_ADJUSTMENT_MONTH_MISMATCH");
    }

    const snapshot = this.accountsService.getAccountBalanceSnapshot({
      householdId: parsed.householdId,
      accountId: parsed.accountId,
    });
    const previousBalance = new Decimal(parsed.comparisonBalance ?? snapshot.balance);
    const realBalance = new Decimal(parsed.realBalance);
    const difference = realBalance.minus(previousBalance);
    if (difference.isZero()) {
      return {
        previousBalance: previousBalance.toFixed(2),
        realBalance: realBalance.toFixed(2),
        difference: "0.00",
        transaction: null,
      };
    }

    const currentAdjustment = new Decimal(snapshot.account.balanceAdjustment ?? "0");
    this.accountsService.updateBalanceAdjustment({
      householdId: parsed.householdId,
      accountId: parsed.accountId,
      balanceAdjustment: currentAdjustment.plus(difference).toFixed(2),
    });

    return {
      previousBalance: previousBalance.toFixed(2),
      realBalance: realBalance.toFixed(2),
      difference: difference.toFixed(2),
      transaction: null,
    };
  }
}
