export type FreeBalanceRiskLevel = "GREEN" | "YELLOW" | "RED";
export type FreeBalanceConfidence = "HIGH" | "LOW";

export interface FreeBalanceTopDriver {
  label: string;
  amount: string;
  month: string;
}

export interface FreeBalanceAlert {
  level: "info" | "warning" | "danger";
  title: string;
  message: string;
  suggestions: string[];
}

export interface FreeBalanceMonthComponents {
  accountStartingBalance: string;
  projectedIncome: string;
  oneOffExpenses: string;
  investments: string;
  cardInvoiceDue: string;
  installments: string;
  recurrences: string;
  lateCarry: string;
}

export type FreeBalancePendingOutflowSource = "ONE_OFF" | "INSTALLMENT" | "RECURRING" | "CARD_INVOICE";

export interface FreeBalancePendingOutflow {
  id: string;
  description: string;
  sourceType: FreeBalancePendingOutflowSource;
  amount: string;
  month: string;
  occurredAt: string | null;
  accountId: string | null;
  accountName: string | null;
  cardId: string | null;
  cardName: string | null;
}

export interface FreeBalanceMonthBreakdown {
  month: string;
  startingBalance: string;
  income: string;
  obligations: string;
  gastosOperacionais: string;
  investimentos: string;
  totalSaidas: string;
  freeBalance: string;
  components: FreeBalanceMonthComponents;
  pendingOutflows: FreeBalancePendingOutflow[];
}

export interface FreeBalanceResult {
  currentMonth: string;
  nextMonth: string;
  freeBalanceCurrent: string;
  freeBalanceNext: string;
  additionalCardSpendCapacity: string;
  risk: FreeBalanceRiskLevel;
  confidence: FreeBalanceConfidence;
  missingData: string[];
  topDrivers: FreeBalanceTopDriver[];
  alerts: FreeBalanceAlert[];
  breakdown: {
    current: FreeBalanceMonthBreakdown;
    next: FreeBalanceMonthBreakdown;
  };
}

export interface GetFreeBalanceInput {
  householdId: string;
  month: string;
}
