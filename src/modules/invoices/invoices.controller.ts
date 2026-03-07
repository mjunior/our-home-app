import type {
  CardInvoiceEntriesInput,
  CardInvoicesInput,
  DueObligationsInput,
  MonthlyInvoicesInput,
  MonthlyCashflowInput,
} from "./invoices.service";
import { InvoicesService } from "./invoices.service";

export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  getCardInvoices(payload: CardInvoicesInput) {
    return this.service.getCardCurrentAndNext(payload);
  }

  getMonthlyCashflowSummary(payload: MonthlyCashflowInput) {
    return this.service.getMonthlyCashflowSummary(payload);
  }

  getMonthlyInvoices(payload: MonthlyInvoicesInput) {
    return this.service.getMonthlyInvoices(payload);
  }

  getDueObligationsByMonth(payload: DueObligationsInput) {
    return this.service.getDueObligationsByMonth(payload);
  }

  getCardInvoiceEntriesByDueMonth(payload: CardInvoiceEntriesInput) {
    return this.service.getCardInvoiceEntriesByDueMonth(payload);
  }

  settleInvoice(payload: {
    householdId: string;
    cardId: string;
    dueMonth: string;
    paymentAccountId: string;
    paidAt: string;
    paidAmount: string;
  }) {
    return this.service.settleInvoice(payload);
  }

  unsettleInvoice(payload: { householdId: string; cardId: string; dueMonth: string }) {
    return this.service.unsettleInvoice(payload);
  }
}
