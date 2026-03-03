import type {
  CreateInvestmentTransferInput,
  CreateTransactionInput,
  DeleteInvestmentTransferInput,
  DeleteTransactionInput,
  ListTransactionsInput,
  UpdateInvestmentTransferInput,
  UpdateTransactionInput,
} from "./transactions.service";
import { TransactionsService } from "./transactions.service";

export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  createTransaction(payload: CreateTransactionInput) {
    return this.service.create(payload);
  }

  createInvestmentTransfer(payload: CreateInvestmentTransferInput) {
    return this.service.createInvestmentTransfer(payload);
  }

  updateTransaction(payload: UpdateTransactionInput) {
    return this.service.update(payload);
  }

  updateInvestmentTransfer(payload: UpdateInvestmentTransferInput) {
    return this.service.updateInvestmentTransfer(payload);
  }

  deleteTransaction(payload: DeleteTransactionInput) {
    return this.service.remove(payload);
  }

  deleteInvestmentTransfer(payload: DeleteInvestmentTransferInput) {
    return this.service.removeInvestmentTransfer(payload);
  }

  listTransactionsByMonth(payload: ListTransactionsInput) {
    return this.service.listByMonth(payload);
  }
}
