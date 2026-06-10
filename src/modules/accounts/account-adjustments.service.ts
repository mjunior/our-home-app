import Decimal from "decimal.js";
import { z } from "zod";

import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsRepository, type TransactionRecord } from "../transactions/transactions.repository";
import { AccountsService } from "./accounts.service";
import { createId } from "../../domain/shared/id";

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

    // Instead of updating the legacy 'balanceAdjustment' field, 
    // we create a specialized transaction with a system tag.
    // This transaction will be ignored in statements but used in balance calculations.
    
    let adjustmentCategory = this.categoriesRepository.listByHousehold(parsed.householdId).find(c => c.normalized === "ajuste-de-saldo");
    if (!adjustmentCategory) {
        adjustmentCategory = this.categoriesRepository.create({
            householdId: parsed.householdId,
            name: "Ajuste de Saldo",
            normalized: "ajuste-de-saldo",
        });
    }

    const transaction = this.transactionsRepository.create({
        id: createId(),
        householdId: parsed.householdId,
        kind: difference.isPositive() ? "INCOME" : "EXPENSE",
        description: "Reajuste de Saldo (Sistema)",
        amount: difference.abs().toFixed(2),
        occurredAt: parsed.occurredAt,
        categoryId: adjustmentCategory.id,
        accountId: parsed.accountId,
        settlementStatus: "PAID",
        systemTag: "BALANCE_ADJUSTMENT",
    });

    return {
      previousBalance: previousBalance.toFixed(2),
      realBalance: realBalance.toFixed(2),
      difference: difference.toFixed(2),
      transaction,
    };
  }
}
