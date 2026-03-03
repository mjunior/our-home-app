import { createId } from "../../domain/shared/id";
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

const updateInputSchema = transactionInputSchema.extend({
  id: z.string().min(1),
});

const deleteInputSchema = z.object({
  id: z.string().min(1),
  householdId: z.string().min(1),
});

const createInvestmentInputSchema = z.object({
  householdId: z.string().min(1),
  description: z.string().min(1),
  amount: z.string().min(1),
  occurredAt: z.string().datetime(),
  categoryId: z.string().min(1),
  sourceAccountId: z.string().min(1),
  destinationAccountId: z.string().min(1),
});

const updateInvestmentInputSchema = createInvestmentInputSchema.extend({
  transferGroupId: z.string().min(1),
});

const deleteInvestmentInputSchema = z.object({
  householdId: z.string().min(1),
  transferGroupId: z.string().min(1),
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

export interface UpdateTransactionInput extends CreateTransactionInput {
  id: string;
}

export interface DeleteTransactionInput {
  id: string;
  householdId: string;
}

export interface CreateInvestmentTransferInput {
  householdId: string;
  description: string;
  amount: string;
  occurredAt: string;
  categoryId: string;
  sourceAccountId: string;
  destinationAccountId: string;
}

export interface UpdateInvestmentTransferInput extends CreateInvestmentTransferInput {
  transferGroupId: string;
}

export interface DeleteInvestmentTransferInput {
  householdId: string;
  transferGroupId: string;
}

export interface InvestmentTransferResult {
  transferGroupId: string;
  debit: TransactionRecord;
  credit: TransactionRecord;
}

function sortTransferPair(items: TransactionRecord[]): { debit: TransactionRecord; credit: TransactionRecord } {
  const debit = items.find((item) => item.kind === "EXPENSE");
  const credit = items.find((item) => item.kind === "INCOME");

  if (!debit || !credit) {
    throw new Error("INVESTMENT_TRANSFER_BROKEN");
  }

  return { debit, credit };
}

export class TransactionsService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly accountsRepository: AccountsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  private assertCategory(householdId: string, categoryId: string) {
    const category = this.categoriesRepository.findById(categoryId);
    if (!category || category.householdId !== householdId) {
      throw new Error("CATEGORY_NOT_FOUND");
    }
  }

  private assertAccountOwnership(householdId: string, accountId: string) {
    const account = this.accountsRepository.findById(accountId);
    if (!account || account.householdId !== householdId) {
      throw new Error("ACCOUNT_NOT_FOUND");
    }
    return account;
  }

  private assertCardOwnership(householdId: string, cardId: string) {
    const card = this.cardsRepository.findById(cardId);
    if (!card || card.householdId !== householdId) {
      throw new Error("CARD_NOT_FOUND");
    }
    return card;
  }

  private validateCoreBinding(parsed: CreateTransactionInput | UpdateTransactionInput) {
    this.assertCategory(parsed.householdId, parsed.categoryId);

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
      this.assertAccountOwnership(parsed.householdId, parsed.accountId);
    }

    if (parsed.creditCardId) {
      this.assertCardOwnership(parsed.householdId, parsed.creditCardId);
    }
  }

  create(input: CreateTransactionInput): TransactionRecord {
    const parsed = transactionInputSchema.parse(input);
    this.validateCoreBinding(parsed);

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
      transferGroupId: null,
    });
  }

  createInvestmentTransfer(input: CreateInvestmentTransferInput): InvestmentTransferResult {
    const parsed = createInvestmentInputSchema.parse(input);

    if (parsed.sourceAccountId === parsed.destinationAccountId) {
      throw new Error("INVESTMENT_TRANSFER_REQUIRES_DISTINCT_ACCOUNTS");
    }

    const source = this.assertAccountOwnership(parsed.householdId, parsed.sourceAccountId);
    const destination = this.assertAccountOwnership(parsed.householdId, parsed.destinationAccountId);
    this.assertCategory(parsed.householdId, parsed.categoryId);

    if (source.type !== "CHECKING") {
      throw new Error("INVESTMENT_SOURCE_MUST_BE_CHECKING");
    }

    if (destination.type !== "INVESTMENT") {
      throw new Error("INVESTMENT_DESTINATION_MUST_BE_INVESTMENT");
    }

    const transferGroupId = createId();
    const description = parsed.description.trim();

    const debit = this.transactionsRepository.create({
      householdId: parsed.householdId,
      kind: "EXPENSE",
      description,
      amount: parsed.amount,
      occurredAt: parsed.occurredAt,
      accountId: parsed.sourceAccountId,
      creditCardId: null,
      categoryId: parsed.categoryId,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      transferGroupId,
    });

    const credit = this.transactionsRepository.create({
      householdId: parsed.householdId,
      kind: "INCOME",
      description,
      amount: parsed.amount,
      occurredAt: parsed.occurredAt,
      accountId: parsed.destinationAccountId,
      creditCardId: null,
      categoryId: parsed.categoryId,
      invoiceMonthKey: null,
      invoiceDueDate: null,
      transferGroupId,
    });

    return { transferGroupId, debit, credit };
  }

  update(input: UpdateTransactionInput): TransactionRecord {
    const parsed = updateInputSchema.parse(input);
    const existing = this.transactionsRepository.findById(parsed.id);
    if (!existing) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    if (existing.householdId !== parsed.householdId) {
      throw new Error("TRANSACTION_HOUSEHOLD_MISMATCH");
    }
    if (existing.transferGroupId) {
      throw new Error("INVESTMENT_TRANSFER_REQUIRES_GROUP_UPDATE");
    }

    this.validateCoreBinding(parsed);

    return this.transactionsRepository.update(parsed.id, {
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

  updateInvestmentTransfer(input: UpdateInvestmentTransferInput): InvestmentTransferResult {
    const parsed = updateInvestmentInputSchema.parse(input);

    if (parsed.sourceAccountId === parsed.destinationAccountId) {
      throw new Error("INVESTMENT_TRANSFER_REQUIRES_DISTINCT_ACCOUNTS");
    }

    const pair = this.transactionsRepository.listByTransferGroupId(parsed.householdId, parsed.transferGroupId);
    if (pair.length !== 2) {
      throw new Error("INVESTMENT_TRANSFER_NOT_FOUND");
    }

    const source = this.assertAccountOwnership(parsed.householdId, parsed.sourceAccountId);
    const destination = this.assertAccountOwnership(parsed.householdId, parsed.destinationAccountId);
    this.assertCategory(parsed.householdId, parsed.categoryId);

    if (source.type !== "CHECKING") {
      throw new Error("INVESTMENT_SOURCE_MUST_BE_CHECKING");
    }

    if (destination.type !== "INVESTMENT") {
      throw new Error("INVESTMENT_DESTINATION_MUST_BE_INVESTMENT");
    }

    const { debit, credit } = sortTransferPair(pair);
    const description = parsed.description.trim();

    const updatedDebit = this.transactionsRepository.update(debit.id, {
      kind: "EXPENSE",
      description,
      amount: parsed.amount,
      occurredAt: parsed.occurredAt,
      accountId: parsed.sourceAccountId,
      creditCardId: null,
      categoryId: parsed.categoryId,
      invoiceMonthKey: null,
      invoiceDueDate: null,
    });

    const updatedCredit = this.transactionsRepository.update(credit.id, {
      kind: "INCOME",
      description,
      amount: parsed.amount,
      occurredAt: parsed.occurredAt,
      accountId: parsed.destinationAccountId,
      creditCardId: null,
      categoryId: parsed.categoryId,
      invoiceMonthKey: null,
      invoiceDueDate: null,
    });

    return {
      transferGroupId: parsed.transferGroupId,
      debit: updatedDebit,
      credit: updatedCredit,
    };
  }

  remove(input: DeleteTransactionInput): { deleted: true } {
    const parsed = deleteInputSchema.parse(input);
    const existing = this.transactionsRepository.findById(parsed.id);
    if (!existing) {
      throw new Error("TRANSACTION_NOT_FOUND");
    }
    if (existing.householdId !== parsed.householdId) {
      throw new Error("TRANSACTION_HOUSEHOLD_MISMATCH");
    }
    if (existing.transferGroupId) {
      this.transactionsRepository.removeByTransferGroupId(parsed.householdId, existing.transferGroupId);
      return { deleted: true };
    }

    this.transactionsRepository.remove(parsed.id);
    return { deleted: true };
  }

  removeInvestmentTransfer(input: DeleteInvestmentTransferInput): { deleted: true } {
    const parsed = deleteInvestmentInputSchema.parse(input);
    const pair = this.transactionsRepository.listByTransferGroupId(parsed.householdId, parsed.transferGroupId);
    if (pair.length !== 2) {
      throw new Error("INVESTMENT_TRANSFER_NOT_FOUND");
    }

    this.transactionsRepository.removeByTransferGroupId(parsed.householdId, parsed.transferGroupId);
    return { deleted: true };
  }

  listByMonth(input: ListTransactionsInput): TransactionRecord[] {
    const parsed = listInputSchema.parse(input);
    return this.transactionsRepository.listByHouseholdMonth(parsed.householdId, parsed);
  }

  clearAll() {
    this.transactionsRepository.clearAll();
  }
}
