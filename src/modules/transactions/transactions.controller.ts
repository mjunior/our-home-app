import type { CreateTransactionInput, DeleteTransactionInput, ListTransactionsInput, UpdateTransactionInput } from "./transactions.service";
import { TransactionsService } from "./transactions.service";

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  createTransaction(payload: CreateTransactionInput) {
    return this.service.create(payload);
  }

  updateTransaction(payload: UpdateTransactionInput) {
    return this.service.update(payload);
  }

  deleteTransaction(payload: DeleteTransactionInput) {
    return this.service.remove(payload);
  }

  listTransactionsByMonth(payload: ListTransactionsInput) {
    return this.service.listByMonth(payload);
  }
}
