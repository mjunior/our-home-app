import type { CreateTransactionInput, ListTransactionsInput } from "./transactions.service";
import { TransactionsService } from "./transactions.service";

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  createTransaction(payload: CreateTransactionInput) {
    return this.service.create(payload);
  }

  listTransactionsByMonth(payload: ListTransactionsInput) {
    return this.service.listByMonth(payload);
  }
}
