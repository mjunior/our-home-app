import { sumMoney } from "../../domain/shared/money";
import { CardsRepository } from "../cards/cards.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { InvoiceCycleService } from "./invoice-cycle.service";

export interface CardInvoicesInput {
  householdId: string;
  cardId: string;
  referenceDate: string;
}

export interface MonthlyCashflowInput {
  householdId: string;
  month: string;
}

export class InvoicesService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly cycleService: InvoiceCycleService,
  ) {}

  getCardCurrentAndNext(input: CardInvoicesInput) {
    const card = this.cardsRepository.findById(input.cardId);

    if (!card || card.householdId !== input.householdId) {
      throw new Error("CARD_NOT_FOUND");
    }

    const cycles = this.cycleService.resolveCurrentAndNext(input.referenceDate, card.closeDay, card.dueDay);
    const cardExpenses = this.transactionsRepository
      .listByHousehold(input.householdId)
      .filter((item) => item.kind === "EXPENSE" && item.creditCardId === input.cardId);

    const currentAmounts: string[] = [];
    const nextAmounts: string[] = [];

    for (const expense of cardExpenses) {
      const cycle =
        expense.invoiceMonthKey === null
          ? this.cycleService.resolveExpenseCycle(expense.occurredAt, card.closeDay, card.dueDay)
          : { monthKey: expense.invoiceMonthKey, dueDate: expense.invoiceDueDate ?? cycles.current.dueDate };

      if (cycle.monthKey === cycles.current.monthKey) {
        currentAmounts.push(expense.amount);
      }

      if (cycle.monthKey === cycles.next.monthKey) {
        nextAmounts.push(expense.amount);
      }
    }

    return {
      cardId: card.id,
      cardName: card.name,
      current: {
        monthKey: cycles.current.monthKey,
        dueDate: cycles.current.dueDate,
        total: sumMoney(currentAmounts),
      },
      next: {
        monthKey: cycles.next.monthKey,
        dueDate: cycles.next.dueDate,
        total: sumMoney(nextAmounts),
      },
    };
  }

  getMonthlyCashflowSummary(input: MonthlyCashflowInput) {
    const transactions = this.transactionsRepository.listByHouseholdMonth(input.householdId, { month: input.month });

    const income = transactions.filter((item) => item.kind === "INCOME").map((item) => item.amount);
    const expense = transactions.filter((item) => item.kind === "EXPENSE").map((item) => item.amount);
    const cardObligations = transactions
      .filter((item) => item.kind === "EXPENSE" && item.creditCardId !== null)
      .map((item) => item.amount);

    return {
      month: input.month,
      totalIncome: sumMoney(income),
      totalExpense: sumMoney(expense),
      cardObligations: sumMoney(cardObligations),
    };
  }
}
