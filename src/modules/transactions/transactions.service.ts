import { z } from "zod";

import { AccountsRepository } from "../accounts/accounts.repository";
import { CardsRepository } from "../cards/cards.repository";
import { CategoriesRepository } from "../categories/categories.repository";
import {
  TransactionsRepository,
  type TransactionKind,
  type TransactionMonthFilter,
  type TransactionRecord,
} from "./transactions.repository";

const transactionInputSchema = z.object({
  householdId: z.string().min(1),
  kind: z.enum(["INCOME", "EXPENSE"]),
  description: z.string().min(1),
  amount: z.string().min(1),
  occurredAt: z.string().datetime(),
  accountId: z.string().min(1).optional(),
  creditCardId: z.string().min(1).optional(),
  categoryId: z.string().min(1),
});

const listInputSchema = z.object({
  householdId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  accountId: z.string().min(1).optional(),
  creditCardId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
});

export interface CreateTransactionInput {
  householdId: string;
  kind: TransactionKind;
  description: string;
  amount: string;
  occurredAt: string;
  accountId?: string;
  creditCardId?: string;
  categoryId: string;
}

export interface ListTransactionsInput extends TransactionMonthFilter {
  householdId: string;
}

export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  create(input: CreateTransactionInput): TransactionRecord {
    const parsed = transactionInputSchema.parse(input);

    const category = this.categoriesRepository.findById(parsed.categoryId);
    if (!category || category.householdId !== parsed.householdId) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    if (parsed.kind === "INCOME") {
      if (!parsed.accountId || parsed.creditCardId) {
        throw new Error("INCOME_REQUIRES_ACCOUNT_ONLY");
      }
    }

    if (parsed.kind === "EXPENSE") {
      if ((parsed.accountId && parsed.creditCardId) || (!parsed.accountId && !parsed.creditCardId)) {
        throw new Error("EXPENSE_REQUIRES_SINGLE_TARGET");
      }
    }

    if (parsed.accountId) {
      const account = this.accountsRepository.findById(parsed.accountId);
      if (!account || account.householdId !== parsed.householdId) {
        throw new Error("ACCOUNT_NOT_FOUND");
      }
    }

    if (parsed.creditCardId) {
      const card = this.cardsRepository.findById(parsed.creditCardId);
      if (!card || card.householdId !== parsed.householdId) {
        throw new Error("CARD_NOT_FOUND");
      }
    }

    return this.transactionsRepository.create({
      householdId: parsed.householdId,
      kind: parsed.kind,
      description: parsed.description.trim(),
      amount: parsed.amount,
      occurredAt: parsed.occurredAt,
      accountId: parsed.accountId ?? null,
      creditCardId: parsed.creditCardId ?? null,
      categoryId: parsed.categoryId,
      invoiceMonthKey: null,
      invoiceDueDate: null,
    });
  }

  listByMonth(input: ListTransactionsInput): TransactionRecord[] {
    const parsed = listInputSchema.parse(input);
    return this.transactionsRepository.listByHouseholdMonth(parsed.householdId, parsed);
  }

  clearAll() {
    this.transactionsRepository.clearAll();
  }
}
