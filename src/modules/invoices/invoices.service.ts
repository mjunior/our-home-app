import { sumMoney } from "../../domain/shared/money";
import { CardsRepository } from "../cards/cards.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { InvoiceCycleService } from "./invoice-cycle.service";

function monthFromIsoDate(value: string): string {
  return value.slice(0, 7);
}

export interface CardInvoicesInput {
  householdId: string;
  cardId: string;
  referenceDate: string;
}

export interface MonthlyCashflowInput {
  householdId: string;
  month: string;
}

export interface DueObligationsInput {
  householdId: string;
  dueMonth: string;
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
      const cycle = this.resolveStoredOrLegacyCycle(expense, card.closeDay, card.dueDay);

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

  getDueObligationsByMonth(input: DueObligationsInput) {
    const cards = this.cardsRepository.listByHousehold(input.householdId);
    const cardMap = new Map(cards.map((card) => [card.id, card]));
    const totalsByCard = new Map<string, string[]>();

    for (const expense of this.transactionsRepository.listByHousehold(input.householdId)) {
      if (expense.kind !== "EXPENSE" || expense.creditCardId === null) {
        continue;
      }

      const card = cardMap.get(expense.creditCardId);
      if (!card) {
        continue;
      }

      const cycle = this.resolveStoredOrLegacyCycle(expense, card.closeDay, card.dueDay);
      const dueMonth = monthFromIsoDate(cycle.dueDate);

      if (dueMonth !== input.dueMonth) {
        continue;
      }

      const current = totalsByCard.get(card.id) ?? [];
      current.push(expense.amount);
      totalsByCard.set(card.id, current);
    }

    const cardsDue = cards
      .map((card) => ({ cardId: card.id, cardName: card.name, total: sumMoney(totalsByCard.get(card.id) ?? []) }))
      .filter((item) => item.total !== "0.00");

    return {
      dueMonth: input.dueMonth,
      total: sumMoney(cardsDue.map((item) => item.total)),
      cards: cardsDue,
    };
  }

  private resolveStoredOrLegacyCycle(
    expense: { occurredAt: string; invoiceMonthKey: string | null; invoiceDueDate: string | null },
    closeDay: number,
    dueDay: number,
  ) {
    if (expense.invoiceMonthKey && expense.invoiceDueDate) {
      return { monthKey: expense.invoiceMonthKey, dueDate: expense.invoiceDueDate };
    }

    if (expense.invoiceMonthKey) {
      return {
        monthKey: expense.invoiceMonthKey,
        dueDate: this.cycleService.resolveExpenseCycle(expense.occurredAt, closeDay, dueDay).dueDate,
      };
    }

    return this.cycleService.resolveExpenseCycle(expense.occurredAt, closeDay, dueDay);
  }
}
