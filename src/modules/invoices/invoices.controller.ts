import type { CardInvoicesInput, MonthlyCashflowInput } from "./invoices.service";
import { InvoicesService } from "./invoices.service";

export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  getCardInvoices(payload: CardInvoicesInput) {
    return this.service.getCardCurrentAndNext(payload);
  }

  getMonthlyCashflowSummary(payload: MonthlyCashflowInput) {
    return this.service.getMonthlyCashflowSummary(payload);
  }
}
