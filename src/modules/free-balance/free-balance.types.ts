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

export interface FreeBalanceCalculationFormula {
  realCheckingBalance: string;
  pendingExpenses: string;
  pendingInvoices: string;
  pendingSchedules: string;
  projectedBalance: string;
}

export interface FreeBalanceCalculationDetail {
  realCheckingBalance: string;
  pendingOutflowsTotal: string;
  pendingOutflows: FreeBalancePendingOutflow[];
  formula: FreeBalanceCalculationFormula;
}

export interface FreeBalanceMonthBreakdown {
  month: string;
  startingBalance: string;
  income: string;
  obligations: string;
  gastosOperacionais: string;
  investimentos: string;
  totalSaidas: string;
  /** @deprecated Use operationalResult */
  freeBalance: string;
  operationalResult: string;
  cumulativeBalance: string;
  components: FreeBalanceMonthComponents;
  pendingOutflows: FreeBalancePendingOutflow[];
}

export interface FreeBalanceProjectionMonth {
  month: string;
  startingBalance: string;
  entradas: string;
  saidas: string;
  investimentos: string;
  /** @deprecated Use operationalResult */
  sobra: string;
  operationalResult: string;
  cumulativeBalance: string;
  endingBalance: string;
}

export interface FreeBalanceProjectionResult {
  startMonth: string;
  endMonth: string;
  months: FreeBalanceProjectionMonth[];
  currentCalculationDetail: FreeBalanceCalculationDetail;
}

export interface FreeBalanceResult {
  currentMonth: string;
  nextMonth: string;
  /** @deprecated Use operationalResult (from current breakdown) */
  freeBalanceCurrent: string;
  /** @deprecated Use operationalResult (from next breakdown) */
  freeBalanceNext: string;
  operationalResultCurrent: string;
  operationalResultNext: string;
  cumulativeBalanceCurrent: string;
  cumulativeBalanceNext: string;
  additionalCardSpendCapacity: string;
  risk: FreeBalanceRiskLevel;
  confidence: FreeBalanceConfidence;
  missingData: string[];
  topDrivers: FreeBalanceTopDriver[];
  alerts: FreeBalanceAlert[];
  currentCalculationDetail: FreeBalanceCalculationDetail;
  breakdown: {
    current: FreeBalanceMonthBreakdown;
    next: FreeBalanceMonthBreakdown;
  };
}

export interface GetFreeBalanceInput {
  householdId: string;
  month: string;
  currentMonth?: string;
}

export interface GetFreeBalanceProjectionInput {
  householdId: string;
  startMonth: string;
  endMonth: string;
  currentMonth?: string;
}
