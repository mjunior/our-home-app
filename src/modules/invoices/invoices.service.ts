import { sumMoney } from "../../domain/shared/money";
import { CardsRepository } from "../cards/cards.repository";
import { type InvoiceSettlementRecord } from "./invoice-settlement.repository";
import {
  type InstallmentPlanRecord,
  type RecurringRuleRecord,
  type ScheduledInstanceRecord,
} from "../scheduling/schedule.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { InvoiceCycleService } from "./invoice-cycle.service";

function monthFromIsoDate(value: string): string {
  return value.slice(0, 7);
}

function toDueDateForMonth(monthKey: string, dueDay: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, dueDay)).toISOString();
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

export interface MonthlyInvoicesInput {
  householdId: string;
  month: string;
}

export interface DueObligationsInput {
  householdId: string;
  dueMonth: string;
}

export interface CardInvoiceEntriesInput {
  householdId: string;
  cardId: string;
  dueMonth: string;
}

interface ScheduleReadRepositoryLike {
  listInstancesByHousehold(householdId: string): ScheduledInstanceRecord[];
  findInstallmentPlanById?(id: string): InstallmentPlanRecord | undefined;
  findRecurringRuleById?(id: string): RecurringRuleRecord | undefined;
}

interface InvoiceSettlementRepositoryLike {
  listByHousehold(householdId: string): InvoiceSettlementRecord[];
  upsert(data: Omit<InvoiceSettlementRecord, "id">): InvoiceSettlementRecord;
  remove(input: { householdId: string; cardId: string; dueMonth: string }): { deleted: boolean };
}

type InvoiceEntryOrigin = "ONE_OFF" | "RECURRING" | "INSTALLMENT";
type InvoiceEntryDisplayGroup = "OPEN_INSTALLMENT" | "LATEST" | "RECURRING";

const invoiceEntryGroupOrder: Record<InvoiceEntryDisplayGroup, number> = {
  OPEN_INSTALLMENT: 0,
  LATEST: 1,
  RECURRING: 2,
};

interface InvoiceEntry {
  id: string;
  description: string;
  amount: string;
  occurredAt: string;
  registeredAt: string;
  categoryId: string;
  sourceType: InvoiceEntryOrigin;
  sourceId: string | null;
  monthKey: string | null;
  installmentSequence: number | null;
}

function resolveInvoiceEntryDisplayGroup(entry: InvoiceEntry): InvoiceEntryDisplayGroup {
  if (entry.sourceType === "INSTALLMENT" && entry.installmentSequence !== 1) {
    return "OPEN_INSTALLMENT";
  }

  if (entry.sourceType === "RECURRING") {
    return "RECURRING";
  }

  return "LATEST";
}

function compareInvoiceEntries(a: InvoiceEntry, b: InvoiceEntry): number {
  const groupDiff = invoiceEntryGroupOrder[resolveInvoiceEntryDisplayGroup(a)] - invoiceEntryGroupOrder[resolveInvoiceEntryDisplayGroup(b)];
  if (groupDiff !== 0) {
    return groupDiff;
  }

  const registeredDiff = b.registeredAt.localeCompare(a.registeredAt);
  if (registeredDiff !== 0) {
    return registeredDiff;
  }

  const occurredDiff = b.occurredAt.localeCompare(a.occurredAt);
  if (occurredDiff !== 0) {
    return occurredDiff;
  }

  return a.description.localeCompare(b.description, "pt-BR");
}

export class InvoicesService {
  constructor(
    private readonly transactionsRepository: TransactionsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly cycleService: InvoiceCycleService,
    private readonly scheduleRepository?: ScheduleReadRepositoryLike,
    private readonly invoiceSettlementRepository?: InvoiceSettlementRepositoryLike,
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

    const scheduledInstances = this.scheduleRepository?.listInstancesByHousehold(input.householdId) ?? [];
    for (const instance of scheduledInstances) {
      if (instance.kind !== "EXPENSE" || instance.creditCardId === null || instance.monthKey !== input.dueMonth) {
        continue;
      }

      const card = cardMap.get(instance.creditCardId);
      if (!card) {
        continue;
      }

      const current = totalsByCard.get(card.id) ?? [];
      current.push(instance.amount);
      totalsByCard.set(card.id, current);
    }

    const settlementsByCard = new Map(
      (this.invoiceSettlementRepository?.listByHousehold(input.householdId) ?? [])
        .filter((item) => item.dueMonth === input.dueMonth)
        .map((item) => [item.cardId, item]),
    );

    const cardsDue = cards
      .map((card) => ({
        cardId: card.id,
        cardName: card.name,
        dueDay: card.dueDay,
        dueDate: toDueDateForMonth(input.dueMonth, card.dueDay),
        total: sumMoney(totalsByCard.get(card.id) ?? []),
        paid: settlementsByCard.has(card.id),
        paymentAccountId: settlementsByCard.get(card.id)?.paymentAccountId ?? null,
        paidAt: settlementsByCard.get(card.id)?.paidAt ?? null,
      }))
      .filter((item) => item.total !== "0.00");

    return {
      dueMonth: input.dueMonth,
      total: sumMoney(cardsDue.map((item) => item.total)),
      cards: cardsDue,
    };
  }

  getMonthlyInvoices(input: MonthlyInvoicesInput) {
    const due = this.getDueObligationsByMonth({ householdId: input.householdId, dueMonth: input.month });
    const dueByCard = new Map(due.cards.map((item) => [item.cardId, item]));
    const cards = this.cardsRepository.listByHousehold(input.householdId).map((card) => {
      const dueForCard = dueByCard.get(card.id);
      return {
        cardId: card.id,
        cardName: card.name,
        dueDay: card.dueDay,
        dueDate: toDueDateForMonth(input.month, card.dueDay),
        total: dueForCard?.total ?? "0.00",
        paid: dueForCard?.paid ?? false,
        paymentAccountId: dueForCard?.paymentAccountId ?? null,
        paidAt: dueForCard?.paidAt ?? null,
      };
    });

    return {
      month: input.month,
      total: due.total,
      cards,
    };
  }

  settleInvoice(input: {
    householdId: string;
    cardId: string;
    dueMonth: string;
    paymentAccountId: string;
    paidAt: string;
    paidAmount: string;
  }) {
    if (!this.invoiceSettlementRepository) {
      throw new Error("INVOICE_SETTLEMENT_REPOSITORY_NOT_CONFIGURED");
    }

    return this.invoiceSettlementRepository.upsert({
      householdId: input.householdId,
      cardId: input.cardId,
      dueMonth: input.dueMonth,
      paymentAccountId: input.paymentAccountId,
      paidAt: input.paidAt,
      paidAmount: input.paidAmount,
    });
  }

  unsettleInvoice(input: { householdId: string; cardId: string; dueMonth: string }) {
    if (!this.invoiceSettlementRepository) {
      throw new Error("INVOICE_SETTLEMENT_REPOSITORY_NOT_CONFIGURED");
    }
    return this.invoiceSettlementRepository.remove(input);
  }

  getCardInvoiceEntriesByDueMonth(input: CardInvoiceEntriesInput) {
    const card = this.cardsRepository.findById(input.cardId);
    if (!card || card.householdId !== input.householdId) {
      throw new Error("CARD_NOT_FOUND");
    }

    const entries: InvoiceEntry[] = [];

    for (const expense of this.transactionsRepository.listByHousehold(input.householdId)) {
      if (expense.kind !== "EXPENSE" || expense.creditCardId !== card.id) {
        continue;
      }

      const cycle = this.resolveStoredOrLegacyCycle(expense, card.closeDay, card.dueDay);
      const dueMonth = monthFromIsoDate(cycle.dueDate);
      if (dueMonth !== input.dueMonth) {
        continue;
      }

      entries.push({
        id: expense.id,
        description: expense.description,
        amount: expense.amount,
        occurredAt: expense.occurredAt,
        registeredAt: expense.createdAt ?? expense.occurredAt,
        categoryId: expense.categoryId,
        sourceType: "ONE_OFF",
        sourceId: null,
        monthKey: null,
        installmentSequence: null,
      });
    }

    const scheduledInstances = this.scheduleRepository?.listInstancesByHousehold(input.householdId) ?? [];
    for (const instance of scheduledInstances) {
      if (
        instance.kind !== "EXPENSE" ||
        instance.creditCardId !== card.id ||
        instance.monthKey !== input.dueMonth
      ) {
        continue;
      }

      const source = instance.sourceType === "INSTALLMENT"
        ? this.scheduleRepository?.findInstallmentPlanById?.(instance.sourceId)
        : this.scheduleRepository?.findRecurringRuleById?.(instance.sourceId);

      entries.push({
        id: `schedule:${instance.id}`,
        description: instance.description,
        amount: instance.amount,
        occurredAt: instance.occurredAt,
        registeredAt: source?.createdAt ?? instance.occurredAt,
        categoryId: instance.categoryId,
        sourceType: instance.sourceType,
        sourceId: instance.sourceId,
        monthKey: instance.monthKey,
        installmentSequence: instance.sourceType === "INSTALLMENT" ? instance.sequence : null,
      });
    }

    entries.sort(compareInvoiceEntries);

    return {
      cardId: card.id,
      cardName: card.name,
      dueMonth: input.dueMonth,
      dueDate: toDueDateForMonth(input.dueMonth, card.dueDay),
      total: sumMoney(entries.map((item) => item.amount)),
      entries,
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
