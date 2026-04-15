import Decimal from "decimal.js";
import { z } from "zod";

import { normalizeCategoryName } from "../../domain/categories/category.entity";
import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsRepository, type TransactionKind, type TransactionRecord } from "../transactions/transactions.repository";
import { AccountsService } from "./accounts.service";

const accountAdjustmentInputSchema = z.object({
  householdId: z.string().min(1),
  accountId: z.string().min(1),
  realBalance: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  occurredAt: z.string().datetime(),
});

export interface CreateAccountAdjustmentInput {
  householdId: string;
  accountId: string;
  realBalance: string;
  month: string;
  occurredAt: string;
}

export interface AccountAdjustmentResult {
  previousBalance: string;
  realBalance: string;
  difference: string;
  transaction: TransactionRecord;
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
    const previousBalance = new Decimal(snapshot.balance);
    const realBalance = new Decimal(parsed.realBalance);
    const difference = realBalance.minus(previousBalance);
    const kind: TransactionKind = difference.isNegative() ? "EXPENSE" : "INCOME";
    const normalized = normalizeCategoryName("Reajuste");
    const category =
      this.categoriesRepository.findByNormalized(parsed.householdId, normalized) ??
      this.categoriesRepository.create({
        householdId: parsed.householdId,
        name: "Reajuste",
        normalized,
      });

    const transaction = this.transactionsRepository.create({
      householdId: parsed.householdId,
      kind,
      description: "REAJUSTE",
      amount: difference.abs().toFixed(2),
      occurredAt: parsed.occurredAt,
      accountId: parsed.accountId,
      creditCardId: null,
      categoryId: category.id,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      settlementStatus: "PAID",
      transferGroupId: null,
    });

    return {
      previousBalance: previousBalance.toFixed(2),
      realBalance: realBalance.toFixed(2),
      difference: difference.toFixed(2),
      transaction,
    };
  }
}
