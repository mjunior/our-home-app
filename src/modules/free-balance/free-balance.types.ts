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
  cardInvoiceDue: string;
  installments: string;
  recurrences: string;
  lateCarry: string;
}

export interface FreeBalanceMonthBreakdown {
  month: string;
  startingBalance: string;
  income: string;
  obligations: string;
  freeBalance: string;
  components: FreeBalanceMonthComponents;
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
