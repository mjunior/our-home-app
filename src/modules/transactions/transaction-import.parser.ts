import Decimal from "decimal.js";

interface ParsedImportLineBase {
  lineNumber: number;
  raw: string;
  dateToken: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  categoryToken: string;
  accountToken: string;
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
export type ParsedImportLine = ParsedImportValidatedLine;

export interface ParsedImportError {
  lineNumber: number;
  raw: string;
  reason: string;
}

export interface ParsedImportResult {
  valid: ParsedImportValidatedLine[];
  invalid: ParsedImportError[];
}

const kindMap: Record<string, ParsedImportLineBase["kind"]> = {
  entrada: "INCOME",
  income: "INCOME",
  in: "INCOME",
  saida: "EXPENSE",
  expense: "EXPENSE",
  out: "EXPENSE",
};

const recurringMap: Record<string, boolean> = {
  recorrente: true,
  nao: false,
  não: false,
};

function isValidDayMonth(day: number, month: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  const maxByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= maxByMonth[month - 1]!;
}

const singleAmountPattern = /^\d+([.,]\d+)?$/;
const installmentByValuePattern = /^(\d+([.,]\d+)?)x(\d+)$/;
const installmentByTotalPattern = /^(\d+([.,]\d+)?)\/(\d+)$/;

function toDecimalAmount(value: string): Decimal {
  return new Decimal(value.replace(",", "."));
}

function parseAmountToken(amountToken: string):
  | { valueMode: "SINGLE"; amount: string }
  | { valueMode: "INSTALLMENT"; totalAmount: string; installmentsCount: number }
  | null {
  if (singleAmountPattern.test(amountToken)) {
    const amount = toDecimalAmount(amountToken);
    if (amount.lte(0)) return null;
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

function isSpaceSeparatedInstallmentToken(parts: string[]): boolean {
  if (parts.length !== 8) return false;
  const amountLeft = parts[3] ?? "";
  const amountRight = parts[4] ?? "";
  if (!singleAmountPattern.test(amountLeft)) return false;
  return /^x\d+$/.test(amountRight) || /^\/\d+$/.test(amountRight);
}

export function parseTransactionImportText(input: string): ParsedImportResult {
  const valid: ParsedImportValidatedLine[] = [];
  const invalid: ParsedImportError[] = [];

  const lines = input.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = raw.trim();
    const lineNumber = index + 1;

    if (!line) {
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length !== 7) {
      invalid.push({
        lineNumber,
        raw,
        reason: isSpaceSeparatedInstallmentToken(parts) ? "VALOR_INVALIDO" : "FORMATO_INVALIDO_ESPERADO_7_TOKENS",
      });
      continue;
    }

    const [dateToken, kindToken, description, amountToken, categoryToken, accountToken, recurringToken] = parts;

    const dateMatch = /^(\d{2})\/(\d{2})$/.exec(dateToken ?? "");
    if (!dateMatch) {
      invalid.push({
        lineNumber,
        raw,
        reason: "DATA_INVALIDA_USE_DD_MM",
      });
      continue;
    }

    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    if (!isValidDayMonth(day, month)) {
      invalid.push({
        lineNumber,
        raw,
        reason: "DATA_DIA_MES_INVALIDA",
      });
      continue;
    }

    const kind = kindMap[(kindToken ?? "").toLowerCase()];
    if (!kind) {
      invalid.push({
        lineNumber,
        raw,
        reason: "TIPO_INVALIDO_USE_ENTRADA_OU_SAIDA",
      });
      continue;
    }

    const parsedAmount = parseAmountToken(amountToken ?? "");
    if (!parsedAmount) {
      invalid.push({
        lineNumber,
        raw,
        reason: "VALOR_INVALIDO",
      });
      continue;
    }

    if (kind === "INCOME" && parsedAmount.valueMode === "INSTALLMENT") {
      invalid.push({
        lineNumber,
        raw,
        reason: "PARCELAMENTO_PERMITE_APENAS_SAIDA",
      });
      continue;
    }

    const recurring = recurringMap[(recurringToken ?? "").toLowerCase()];
    if (typeof recurring !== "boolean") {
      invalid.push({
        lineNumber,
        raw,
        reason: "RECORRENCIA_INVALIDA_USE_RECORRENTE_OU_NAO",
      });
      continue;
    }

    const base = {
      lineNumber,
      raw,
      dateToken: dateToken!,
      kind,
      description: description!,
      categoryToken: categoryToken!,
      accountToken: accountToken!,
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

export function toIsoDateAtNoon(dateToken: string, referenceYear: number): string {
  const match = /^(\d{2})\/(\d{2})$/.exec(dateToken);
  if (!match) {
    throw new Error("INVALID_DATE_TOKEN");
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!isValidDayMonth(day, month)) {
    throw new Error("INVALID_DAY_MONTH");
  }

  return `${referenceYear.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T12:00:00.000Z`;
}
