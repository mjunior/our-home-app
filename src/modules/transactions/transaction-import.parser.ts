import Decimal from "decimal.js";

interface ParsedImportLineBase {
  lineNumber: number;
  raw: string;
  kind: "EXPENSE";
  description: string;
  recurring: boolean;
}

type ParsedImportSingleLine = ParsedImportLineBase & {
  valueMode: "SINGLE";
  amount: string;
};

type ParsedImportInstallmentLine = ParsedImportLineBase & {
  valueMode: "INSTALLMENT";
  totalAmount: string;
  installmentsCount: number;
};

export type ParsedImportValidatedLine = ParsedImportSingleLine | ParsedImportInstallmentLine;

export interface ParsedImportError {
  lineNumber: number;
  raw: string;
  reason: string;
}

export interface ParsedImportResult {
  valid: ParsedImportValidatedLine[];
  invalid: ParsedImportError[];
}

const recurringMap: Record<string, boolean> = {
  recorrente: true,
  sim: true,
  r: true,
  mensal: true,
};

const singleAmountPattern = /^-?\d+([.,]\d+)?$/;
const installmentByValuePattern = /^(-?\d+([.,]\d+)?)\*(\d+)$/;
const installmentByTotalPattern = /^(-?\d+([.,]\d+)?)\/(\d+)$/;

function toDecimalAmount(value: string): Decimal {
  return new Decimal(value.replace(",", "."));
}

function parseAmountToken(amountToken: string):
  | { valueMode: "SINGLE"; amount: string }
  | { valueMode: "INSTALLMENT"; totalAmount: string; installmentsCount: number }
  | null {
  if (singleAmountPattern.test(amountToken)) {
    const amount = toDecimalAmount(amountToken);
    if (amount.eq(0)) return null;
    return { valueMode: "SINGLE", amount: amount.toFixed(2) };
  }

  const byValueMatch = installmentByValuePattern.exec(amountToken);
  if (byValueMatch) {
    const amount = toDecimalAmount(byValueMatch[1] ?? "");
    const installmentsCount = Number(byValueMatch[3]);
    if (!amount.gt(0) || !Number.isInteger(installmentsCount) || installmentsCount < 2) return null;
    return {
      valueMode: "INSTALLMENT",
      totalAmount: amount.mul(installmentsCount).toFixed(2),
      installmentsCount,
    };
  }

  const byTotalMatch = installmentByTotalPattern.exec(amountToken);
  if (byTotalMatch) {
    const totalAmount = toDecimalAmount(byTotalMatch[1] ?? "");
    const installmentsCount = Number(byTotalMatch[3]);
    if (!totalAmount.gt(0) || !Number.isInteger(installmentsCount) || installmentsCount < 2) return null;
    return {
      valueMode: "INSTALLMENT",
      totalAmount: totalAmount.toFixed(2),
      installmentsCount,
    };
  }

  return null;
}

export function parseTransactionImportText(input: string): ParsedImportResult {
  const valid: ParsedImportValidatedLine[] = [];
  const invalid: ParsedImportError[] = [];

  const lines = input.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = raw.trim();
    const lineNumber = index + 1;

    if (!line) continue;

    const parts = line.split(/\s+/);
    if (parts.length < 2) {
      invalid.push({ lineNumber, raw, reason: "FORMATO_INVALIDO_DESCRICAO_E_VALOR" });
      continue;
    }

    const maybeRecurring = (parts[parts.length - 1] ?? "").toLowerCase();
    const recurring = recurringMap[maybeRecurring] ?? false;
    const hasRecurringToken = recurringMap[maybeRecurring] === true;

    const amountIndex = hasRecurringToken ? parts.length - 2 : parts.length - 1;
    const amountToken = parts[amountIndex] ?? "";
    const descriptionTokens = parts.slice(0, amountIndex);

    if (descriptionTokens.length === 0) {
      invalid.push({ lineNumber, raw, reason: "DESCRICAO_OBRIGATORIA" });
      continue;
    }

    const parsedAmount = parseAmountToken(amountToken);
    if (!parsedAmount) {
      invalid.push({ lineNumber, raw, reason: "VALOR_INVALIDO" });
      continue;
    }

    const base: ParsedImportLineBase = {
      lineNumber,
      raw,
      kind: "EXPENSE",
      description: descriptionTokens.join(" "),
      recurring,
    };

    if (parsedAmount.valueMode === "SINGLE") {
      valid.push({
        ...base,
        valueMode: "SINGLE",
        amount: parsedAmount.amount,
      });
      continue;
    }

    valid.push({
      ...base,
      valueMode: "INSTALLMENT",
      totalAmount: parsedAmount.totalAmount,
      installmentsCount: parsedAmount.installmentsCount,
    });
  }

  return { valid, invalid };
}

export function toIsoDateAtNoon(dateInput: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    throw new Error("INVALID_DATE_INPUT");
  }

  return `${dateInput}T12:00:00.000Z`;
}
