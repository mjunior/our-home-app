import Decimal from "decimal.js";
import { z } from "zod";

import { AccountAdjustmentsService, type AccountAdjustmentResult } from "../accounts/account-adjustments.service";
import { AccountsService } from "../accounts/accounts.service";
import { CreditCardAdjustmentsService, type CreditCardAdjustmentResult } from "../invoices/credit-card-adjustments.service";
import { InvoicesService } from "../invoices/invoices.service";

const monthCloseInputSchema = z.object({
  householdId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  realAccountBalances: z.record(z.string().min(1), z.string().min(1)).optional(),
  realCardInvoiceTotals: z.record(z.string().min(1), z.string().min(1)).optional(),
});

export interface CloseMonthInput {
  householdId: string;
  month: string;
  /**
   * Only CHECKING accounts with an entered real balance are included in the preview.
   * Missing account ids are treated as not entered and skipped.
   */
  realAccountBalances?: Record<string, string>;
  /**
   * Only due-month card invoices with an entered real total are included in the preview.
   * Missing card ids are treated as not entered and skipped.
   */
  realCardInvoiceTotals?: Record<string, string>;
}

export interface MonthCloseAccountRow {
  accountId: string;
  accountName: string;
  appBalance: string;
  realBalance: string;
  difference: string;
  willCreateAdjustment: boolean;
}

export interface MonthCloseCardInvoiceRow {
  cardId: string;
  cardName: string;
  appTotal: string;
  realTotal: string;
  difference: string;
  willCreateAdjustment: boolean;
}

export interface MonthClosePreview {
  month: string;
  adjustmentDate: string;
  accounts: MonthCloseAccountRow[];
  cardInvoices: MonthCloseCardInvoiceRow[];
}

export interface MonthCloseConfirmResult {
  preview: MonthClosePreview;
  applied: {
    accountAdjustments: Array<{
      accountId: string;
      result: AccountAdjustmentResult;
    }>;
    cardInvoiceAdjustments: Array<{
      cardId: string;
      result: CreditCardAdjustmentResult;
    }>;
  };
}

function adjustmentDateForMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0, 12)).toISOString();
}

function moneyDifference(realValue: string, appValue: string): string {
  return new Decimal(realValue).minus(new Decimal(appValue)).toFixed(2);
}

export class MonthCloseService {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly invoicesService: InvoicesService,
    private readonly accountAdjustmentsService: AccountAdjustmentsService,
    private readonly creditCardAdjustmentsService: CreditCardAdjustmentsService,
  ) {}

  previewCloseMonth(input: CloseMonthInput): MonthClosePreview {
    const parsed = monthCloseInputSchema.parse(input);
    const adjustmentDate = adjustmentDateForMonth(parsed.month);
    const realAccountBalances = parsed.realAccountBalances ?? {};
    const realCardInvoiceTotals = parsed.realCardInvoiceTotals ?? {};

    const accounts = this.accountsService
      .consolidatedBalance(parsed.householdId)
      .accounts.filter((account) => account.type === "CHECKING")
      .filter((account) => Object.prototype.hasOwnProperty.call(realAccountBalances, account.id))
      .map((account): MonthCloseAccountRow => {
        const realBalance = new Decimal(realAccountBalances[account.id] ?? "0").toFixed(2);
        const difference = moneyDifference(realBalance, account.balance);
        return {
          accountId: account.id,
          accountName: account.name,
          appBalance: new Decimal(account.balance).toFixed(2),
          realBalance,
          difference,
          willCreateAdjustment: !new Decimal(difference).isZero(),
        };
      });

    const due = this.invoicesService.getDueObligationsByMonth({
      householdId: parsed.householdId,
      dueMonth: parsed.month,
    });
    const cardInvoices = due.cards
      .filter((card) => Object.prototype.hasOwnProperty.call(realCardInvoiceTotals, card.cardId))
      .map((card): MonthCloseCardInvoiceRow => {
        const realTotal = new Decimal(realCardInvoiceTotals[card.cardId] ?? "0").toFixed(2);
        const difference = moneyDifference(realTotal, card.total);
        return {
          cardId: card.cardId,
          cardName: card.cardName,
          appTotal: new Decimal(card.total).toFixed(2),
          realTotal,
          difference,
          willCreateAdjustment: !new Decimal(difference).isZero(),
        };
      });

    return {
      month: parsed.month,
      adjustmentDate,
      accounts,
      cardInvoices,
    };
  }

  confirmCloseMonth(input: CloseMonthInput): MonthCloseConfirmResult {
    const preview = this.previewCloseMonth(input);

    const accountAdjustments = preview.accounts
      .filter((row) => row.willCreateAdjustment)
      .map((row) => ({
        accountId: row.accountId,
        result: this.accountAdjustmentsService.createAccountAdjustment({
          householdId: input.householdId,
          accountId: row.accountId,
          realBalance: row.realBalance,
          month: preview.month,
          occurredAt: preview.adjustmentDate,
        }),
      }));

    const cardInvoiceAdjustments = preview.cardInvoices
      .filter((row) => row.willCreateAdjustment)
      .map((row) => ({
        cardId: row.cardId,
        result: this.creditCardAdjustmentsService.createCreditCardAdjustment({
          householdId: input.householdId,
          cardId: row.cardId,
          realInvoiceTotal: row.realTotal,
          dueMonth: preview.month,
          occurredAt: preview.adjustmentDate,
        }),
      }));

    return {
      preview,
      applied: {
        accountAdjustments,
        cardInvoiceAdjustments,
      },
    };
  }
}
