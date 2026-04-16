import Decimal from "decimal.js";
import { z } from "zod";

import { AccountsRepository } from "../accounts/accounts.repository";
import { CardsRepository } from "../cards/cards.repository";
import { InvoiceCycleService } from "../invoices/invoice-cycle.service";
import { ScheduleRepository } from "../scheduling/schedule.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { FreeBalancePolicy } from "./free-balance.policy";
import type {
  FreeBalanceMonthBreakdown,
  FreeBalancePendingOutflow,
  FreeBalanceResult,
  FreeBalanceTopDriver,
  GetFreeBalanceInput,
} from "./free-balance.types";
import type { InvoiceSettlementRecord } from "../invoices/invoice-settlement.repository";

const inputSchema = z.object({
  householdId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

type DriverSeed = Omit<FreeBalanceTopDriver, "amount"> & { amount: Decimal };

function addMonths(monthKey: string, count: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}

function monthFromIso(value: string): string {
  return value.slice(0, 7);
}

function sumDecimals(values: Decimal[]): Decimal {
  return values.reduce((acc, current) => acc.plus(current), new Decimal(0));
}

interface CardCharge {
  monthKey: string;
  cardId: string;
  cardName: string;
  amount: Decimal;
}

interface CardObligation {
  monthKey: string;
  cardId: string;
  cardName: string;
  amount: Decimal;
  settled: boolean;
}

interface MonthComputation {
  breakdown: FreeBalanceMonthBreakdown;
  driverSeeds: DriverSeed[];
}

export class FreeBalanceService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    private readonly cardsRepository: CardsRepository,
    private readonly transactionsRepository: TransactionsRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly cycleService: InvoiceCycleService,
    private readonly policy: FreeBalancePolicy,
    private readonly invoiceSettlementRepository?: { listByHousehold(householdId: string): InvoiceSettlementRecord[] },
  ) {}

  getFreeBalance(input: GetFreeBalanceInput): FreeBalanceResult {
    const parsed = inputSchema.parse(input);

    const currentMonth = parsed.month;
    const nextMonth = addMonths(currentMonth, 1);

    const transactions = this.transactionsRepository.listByHousehold(parsed.householdId);
    const scheduleInstances = this.scheduleRepository.listInstancesByHousehold(parsed.householdId);

    const accounts = this.accountsRepository.listByHousehold(parsed.householdId);
    const checkingAccountIds = new Set(accounts.filter((item) => item.type === "CHECKING").map((item) => item.id));
    const accountOpeningBalance = sumDecimals(
      accounts
        .filter((item) => item.type === "CHECKING")
        .map((item) => new Decimal(item.openingBalance)),
    );

    const cardCharges = this.collectCardCharges(parsed.householdId, transactions, scheduleInstances);
    const invoiceSettlements = this.invoiceSettlementRepository?.listByHousehold(parsed.householdId) ?? [];
    const missingData = this.collectMissingData(parsed.householdId, currentMonth, nextMonth, transactions, scheduleInstances, checkingAccountIds);
    const confidence = missingData.length > 0 ? "LOW" : "HIGH";

    const startingCurrent = this.computeStartingBalance(
      parsed.householdId,
      currentMonth,
      accountOpeningBalance,
      transactions,
      scheduleInstances,
      cardCharges,
      invoiceSettlements,
      checkingAccountIds,
    );

    const currentComputation = this.computeMonth(
      parsed.householdId,
      currentMonth,
      startingCurrent,
      new Decimal(0),
      transactions,
      scheduleInstances,
      cardCharges,
      invoiceSettlements,
      checkingAccountIds,
    );
    currentComputation.breakdown.pendingOutflows = this.collectPendingOutflows(
      parsed.householdId,
      currentMonth,
      transactions,
      scheduleInstances,
      cardCharges,
      checkingAccountIds,
      invoiceSettlements,
    );

    const carryToNext = new Decimal(currentComputation.breakdown.freeBalance).lessThan(0)
      ? new Decimal(currentComputation.breakdown.freeBalance).abs()
      : new Decimal(0);

    const nextComputation = this.computeMonth(
      parsed.householdId,
      nextMonth,
      new Decimal(currentComputation.breakdown.freeBalance),
      carryToNext,
      transactions,
      scheduleInstances,
      cardCharges,
      invoiceSettlements,
      checkingAccountIds,
    );

    const topDrivers = [...currentComputation.driverSeeds, ...nextComputation.driverSeeds]
      .sort((a, b) => b.amount.comparedTo(a.amount))
      .slice(0, 3)
      .map((item) => ({
        label: item.label,
        amount: item.amount.toFixed(2),
        month: item.month,
      }));

    const freeBalanceNext = nextComputation.breakdown.freeBalance;
    const policy = this.policy.classify({
      freeBalanceNext,
      confidence,
      missingData,
      topDrivers,
    });

    return {
      currentMonth,
      nextMonth,
      freeBalanceCurrent: currentComputation.breakdown.freeBalance,
      freeBalanceNext,
      additionalCardSpendCapacity: freeBalanceNext,
      risk: policy.risk,
      confidence,
      missingData,
      topDrivers,
      alerts: policy.alerts,
      breakdown: {
        current: currentComputation.breakdown,
        next: nextComputation.breakdown,
      },
    };
  }

  private computeStartingBalance(
    householdId: string,
    month: string,
    openingBalance: Decimal,
    transactions: ReturnType<TransactionsRepository["listByHousehold"]>,
    scheduleInstances: ReturnType<ScheduleRepository["listInstancesByHousehold"]>,
    cardCharges: CardCharge[],
    invoiceSettlements: InvoiceSettlementRecord[],
    checkingAccountIds: Set<string>,
  ): Decimal {
    const accountIncomesBefore = sumDecimals(
      transactions
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.transferGroupId === null &&
            item.kind === "INCOME",
        )
        .filter((item) => monthFromIso(item.occurredAt) < month)
        .map((item) => new Decimal(item.amount)),
    );

    const accountExpensesBefore = sumDecimals(
      transactions
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.kind === "EXPENSE",
        )
        .filter((item) => monthFromIso(item.occurredAt) < month)
        .map((item) => new Decimal(item.amount)),
    );

    const scheduleIncomeBefore = sumDecimals(
      scheduleInstances
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.kind === "INCOME" &&
            item.monthKey < month,
        )
        .map((item) => new Decimal(item.amount)),
    );

    const scheduleExpenseBefore = sumDecimals(
      scheduleInstances
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.kind === "EXPENSE" &&
            item.monthKey < month,
        )
        .map((item) => new Decimal(item.amount)),
    );

    const invoicesDueBefore = sumDecimals(
      this.collectCardObligations(cardCharges, invoiceSettlements)
        .filter((item) => item.monthKey < month)
        .map((item) => item.amount),
    );

    return openingBalance
      .plus(accountIncomesBefore)
      .minus(accountExpensesBefore)
      .plus(scheduleIncomeBefore)
      .minus(scheduleExpenseBefore)
      .minus(invoicesDueBefore);
  }

  private collectCardCharges(
    householdId: string,
    transactions: ReturnType<TransactionsRepository["listByHousehold"]>,
    scheduleInstances: ReturnType<ScheduleRepository["listInstancesByHousehold"]>,
  ): CardCharge[] {
    const charges: CardCharge[] = [];

    for (const item of transactions) {
      if (item.householdId !== householdId || item.kind !== "EXPENSE" || item.creditCardId === null) {
        continue;
      }

      const card = this.cardsRepository.findById(item.creditCardId);
      if (!card) {
        continue;
      }

      const dueMonth =
        item.invoiceDueDate !== null
          ? monthFromIso(item.invoiceDueDate)
          : monthFromIso(this.cycleService.resolveExpenseCycle(item.occurredAt, card.closeDay, card.dueDay).dueDate);
      charges.push({ monthKey: dueMonth, cardId: card.id, cardName: card.name, amount: new Decimal(item.amount) });
    }

    for (const item of scheduleInstances) {
      if (item.householdId !== householdId || item.kind !== "EXPENSE" || item.creditCardId === null) {
        continue;
      }

      const card = this.cardsRepository.findById(item.creditCardId);
      if (!card) {
        continue;
      }

      charges.push({ monthKey: item.monthKey, cardId: card.id, cardName: card.name, amount: new Decimal(item.amount) });
    }

    return charges;
  }

  private collectCardObligations(cardCharges: CardCharge[], invoiceSettlements: InvoiceSettlementRecord[]): CardObligation[] {
    const chargesByKey = new Map<string, { monthKey: string; cardId: string; cardName: string; amount: Decimal }>();
    for (const charge of cardCharges) {
      const key = `${charge.cardId}:${charge.monthKey}`;
      const current = chargesByKey.get(key) ?? {
        monthKey: charge.monthKey,
        cardId: charge.cardId,
        cardName: charge.cardName,
        amount: new Decimal(0),
      };
      current.amount = current.amount.plus(charge.amount);
      chargesByKey.set(key, current);
    }

    const obligations = new Map<string, CardObligation>();
    for (const [key, charge] of chargesByKey.entries()) {
      obligations.set(key, {
        ...charge,
        settled: false,
      });
    }

    for (const settlement of invoiceSettlements) {
      const key = `${settlement.cardId}:${settlement.dueMonth}`;
      const existing = obligations.get(key);
      const card = existing ? null : this.cardsRepository.findById(settlement.cardId);
      obligations.set(key, {
        monthKey: settlement.dueMonth,
        cardId: settlement.cardId,
        cardName: existing?.cardName ?? card?.name ?? "Cartao",
        amount: new Decimal(settlement.paidAmount),
        settled: true,
      });
    }

    return Array.from(obligations.values());
  }

  private collectPendingOutflows(
    householdId: string,
    month: string,
    transactions: ReturnType<TransactionsRepository["listByHousehold"]>,
    scheduleInstances: ReturnType<ScheduleRepository["listInstancesByHousehold"]>,
    cardCharges: CardCharge[],
    checkingAccountIds: Set<string>,
    invoiceSettlements: InvoiceSettlementRecord[],
  ): FreeBalancePendingOutflow[] {
    const accountsById = new Map(this.accountsRepository.listByHousehold(householdId).map((item) => [item.id, item]));
    const settlements = new Set(
      invoiceSettlements
        .filter((item) => item.householdId === householdId && item.dueMonth === month)
        .map((item) => item.cardId),
    );

    const accountOutflows: FreeBalancePendingOutflow[] = transactions
      .filter(
        (item) =>
          item.householdId === householdId &&
          item.kind === "EXPENSE" &&
          item.accountId !== null &&
          checkingAccountIds.has(item.accountId) &&
          item.transferGroupId === null &&
          item.settlementStatus === "UNPAID" &&
          monthFromIso(item.occurredAt) === month,
      )
      .map((item) => {
        const account = item.accountId ? accountsById.get(item.accountId) : undefined;
        return {
          id: `transaction:${item.id}`,
          description: item.description,
          sourceType: "ONE_OFF" as const,
          amount: new Decimal(item.amount).toFixed(2),
          month,
          occurredAt: item.occurredAt,
          accountId: item.accountId,
          accountName: account?.name ?? null,
          cardId: null,
          cardName: null,
        };
      });

    const scheduledOutflows: FreeBalancePendingOutflow[] = scheduleInstances
      .filter(
        (item) =>
          item.householdId === householdId &&
          item.monthKey === month &&
          item.kind === "EXPENSE" &&
          item.accountId !== null &&
          checkingAccountIds.has(item.accountId) &&
          item.settlementStatus === "UNPAID",
      )
      .map((item) => {
        const account = item.accountId ? accountsById.get(item.accountId) : undefined;
        return {
          id: `schedule:${item.id}`,
          description: item.description,
          sourceType: item.sourceType,
          amount: new Decimal(item.amount).toFixed(2),
          month,
          occurredAt: item.occurredAt,
          accountId: item.accountId,
          accountName: account?.name ?? null,
          cardId: null,
          cardName: null,
        };
      });

    const invoiceChargesByCard = new Map<string, { cardName: string; amount: Decimal }>();
    for (const charge of cardCharges.filter((item) => item.monthKey === month)) {
      const current = invoiceChargesByCard.get(charge.cardId) ?? { cardName: charge.cardName, amount: new Decimal(0) };
      current.amount = current.amount.plus(charge.amount);
      invoiceChargesByCard.set(charge.cardId, current);
    }

    const invoiceOutflows = Array.from(invoiceChargesByCard.entries())
      .filter(([cardId, value]) => value.amount.greaterThan(0) && !settlements.has(cardId))
      .map(([cardId, value]) => ({
        id: `invoice:${cardId}:${month}`,
        description: `Fatura ${value.cardName}`,
        sourceType: "CARD_INVOICE" as const,
        amount: value.amount.toFixed(2),
        month,
        occurredAt: null,
        accountId: null,
        accountName: null,
        cardId,
        cardName: value.cardName,
      }));

    return [...accountOutflows, ...scheduledOutflows, ...invoiceOutflows].sort((a, b) => {
      const dateDiff = (a.occurredAt ?? `${a.month}-99`).localeCompare(b.occurredAt ?? `${b.month}-99`);
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return a.description.localeCompare(b.description, "pt-BR");
    });
  }

  private collectMissingData(
    householdId: string,
    currentMonth: string,
    nextMonth: string,
    transactions: ReturnType<TransactionsRepository["listByHousehold"]>,
    scheduleInstances: ReturnType<ScheduleRepository["listInstancesByHousehold"]>,
    checkingAccountIds: Set<string>,
  ): string[] {
    const missing: string[] = [];
    const hasAccounts = checkingAccountIds.size > 0;
    const hasCards = this.cardsRepository.listByHousehold(householdId).length > 0;

    const incomes = transactions.filter(
      (item) => item.householdId === householdId && item.kind === "INCOME" && item.transferGroupId === null,
    );
    const scheduleIncomes = scheduleInstances.filter((item) => item.householdId === householdId && item.kind === "INCOME");

    const expenses = transactions.filter((item) => item.householdId === householdId && item.kind === "EXPENSE");
    const scheduleExpenses = scheduleInstances.filter((item) => item.householdId === householdId && item.kind === "EXPENSE");

    const hasIncomeForecast =
      incomes.some((item) => {
        const month = monthFromIso(item.occurredAt);
        return month === currentMonth || month === nextMonth;
      }) || scheduleIncomes.some((item) => item.monthKey === currentMonth || item.monthKey === nextMonth);

    const hasObligations = expenses.length > 0 || scheduleExpenses.length > 0;

    if (!hasAccounts) {
      missing.push("Cadastre pelo menos uma conta com saldo inicial.");
    }

    if (!hasCards) {
      missing.push("Cadastre cartoes para projetar impacto de fatura.");
    }

    if (!hasIncomeForecast) {
      missing.push("Registre entradas previstas para o mes atual ou proximo.");
    }

    if (!hasObligations) {
      missing.push("Registre despesas, parcelas ou recorrencias para projetar obrigacoes.");
    }

    return missing;
  }

  private computeMonth(
    householdId: string,
    month: string,
    startingBalance: Decimal,
    lateCarry: Decimal,
    transactions: ReturnType<TransactionsRepository["listByHousehold"]>,
    scheduleInstances: ReturnType<ScheduleRepository["listInstancesByHousehold"]>,
    cardCharges: CardCharge[],
    invoiceSettlements: InvoiceSettlementRecord[],
    checkingAccountIds: Set<string>,
  ): MonthComputation {
    const incomeTransactions = sumDecimals(
      transactions
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.kind === "INCOME" &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.transferGroupId === null &&
            monthFromIso(item.occurredAt) === month,
        )
        .map((item) => new Decimal(item.amount)),
    );

    const incomeRecurring = sumDecimals(
      scheduleInstances
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.monthKey === month &&
            item.kind === "INCOME" &&
            item.sourceType === "RECURRING" &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId),
        )
        .map((item) => new Decimal(item.amount)),
    );

    const oneOffExpenses = sumDecimals(
      transactions
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.kind === "EXPENSE" &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.transferGroupId === null &&
            monthFromIso(item.occurredAt) === month,
        )
        .map((item) => new Decimal(item.amount)),
    );

    const investments = sumDecimals(
      transactions
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.kind === "EXPENSE" &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId) &&
            item.transferGroupId !== null &&
            monthFromIso(item.occurredAt) === month,
        )
        .map((item) => new Decimal(item.amount)),
    );

    const installments = sumDecimals(
      scheduleInstances
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.monthKey === month &&
            item.kind === "EXPENSE" &&
            item.sourceType === "INSTALLMENT" &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId),
        )
        .map((item) => new Decimal(item.amount)),
    );

    const recurrences = sumDecimals(
      scheduleInstances
        .filter(
          (item) =>
            item.householdId === householdId &&
            item.monthKey === month &&
            item.kind === "EXPENSE" &&
            item.sourceType === "RECURRING" &&
            item.accountId !== null &&
            checkingAccountIds.has(item.accountId),
        )
        .map((item) => new Decimal(item.amount)),
    );

    const cardInvoiceDue = sumDecimals(
      this.collectCardObligations(cardCharges, invoiceSettlements)
        .filter((item) => item.monthKey === month)
        .map((item) => item.amount),
    );

    const income = incomeTransactions.plus(incomeRecurring);
    const gastosOperacionais = oneOffExpenses.plus(cardInvoiceDue).plus(installments).plus(recurrences).plus(lateCarry);
    const totalSaidas = gastosOperacionais.plus(investments);
    const obligations = totalSaidas;

    const freeBalance = startingBalance.plus(income).minus(obligations);

    const driverSeeds: DriverSeed[] = [
      { label: "Fatura de cartao", amount: cardInvoiceDue, month },
      { label: "Despesas avulsas", amount: oneOffExpenses, month },
      { label: "Investimentos", amount: investments, month },
      { label: "Parcelas", amount: installments, month },
      { label: "Recorrencias", amount: recurrences, month },
      { label: "Atrasos carregados", amount: lateCarry, month },
    ].filter((item) => item.amount.greaterThan(0));

    return {
      breakdown: {
        month,
        startingBalance: startingBalance.toFixed(2),
        income: income.toFixed(2),
        obligations: obligations.toFixed(2),
        gastosOperacionais: gastosOperacionais.toFixed(2),
        investimentos: investments.toFixed(2),
        totalSaidas: totalSaidas.toFixed(2),
        freeBalance: freeBalance.toFixed(2),
        components: {
          accountStartingBalance: startingBalance.toFixed(2),
          projectedIncome: income.toFixed(2),
          oneOffExpenses: oneOffExpenses.toFixed(2),
          investments: investments.toFixed(2),
          cardInvoiceDue: cardInvoiceDue.toFixed(2),
          installments: installments.toFixed(2),
          recurrences: recurrences.toFixed(2),
          lateCarry: lateCarry.toFixed(2),
        },
        pendingOutflows: [],
      },
      driverSeeds,
    };
  }
}
