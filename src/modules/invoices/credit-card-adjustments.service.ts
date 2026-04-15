import Decimal from "decimal.js";
import { z } from "zod";

import { normalizeCategoryName } from "../../domain/categories/category.entity";
import { CategoriesRepository } from "../categories/categories.repository";
import { TransactionsRepository, type TransactionRecord } from "../transactions/transactions.repository";
import { InvoicesService } from "./invoices.service";

const creditCardAdjustmentInputSchema = z.object({
  householdId: z.string().min(1),
  cardId: z.string().min(1),
  realInvoiceTotal: z.string().min(1),
  dueMonth: z.string().regex(/^\d{4}-\d{2}$/),
  occurredAt: z.string().datetime(),
});

export interface CreateCreditCardAdjustmentInput {
  householdId: string;
  cardId: string;
  realInvoiceTotal: string;
  dueMonth: string;
  occurredAt: string;
}

export interface CreditCardAdjustmentResult {
  previousInvoiceTotal: string;
  realInvoiceTotal: string;
  difference: string;
  transaction: TransactionRecord;
}

export class CreditCardAdjustmentsService {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly categoriesRepository: CategoriesRepository,
  ) {}

  createCreditCardAdjustment(input: CreateCreditCardAdjustmentInput): CreditCardAdjustmentResult {
    const parsed = creditCardAdjustmentInputSchema.parse(input);
    const invoice = this.invoicesService.getCardInvoiceEntriesByDueMonth({
      householdId: parsed.householdId,
      cardId: parsed.cardId,
      dueMonth: parsed.dueMonth,
    });
    const previousInvoiceTotal = new Decimal(invoice.total);
    const realInvoiceTotal = new Decimal(parsed.realInvoiceTotal);
    const difference = realInvoiceTotal.minus(previousInvoiceTotal);
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
      kind: "EXPENSE",
      description: "REAJUSTE",
      amount: difference.toFixed(2),
      occurredAt: parsed.occurredAt,
      accountId: null,
      creditCardId: parsed.cardId,
      categoryId: category.id,
      invoiceMonthKey: parsed.dueMonth,
      invoiceDueDate: invoice.dueDate,
      settlementStatus: null,
      transferGroupId: null,
    });

    return {
      previousInvoiceTotal: previousInvoiceTotal.toFixed(2),
      realInvoiceTotal: realInvoiceTotal.toFixed(2),
      difference: difference.toFixed(2),
      transaction,
    };
  }
}
