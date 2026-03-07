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
}
