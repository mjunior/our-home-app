export interface ParsedImportLine {
  lineNumber: number;
  raw: string;
  dateToken: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  categoryToken: string;
  accountToken: string;
  recurring: boolean;
}

export interface ParsedImportError {
  lineNumber: number;
  raw: string;
  reason: string;
}

export interface ParsedImportResult {
  valid: ParsedImportLine[];
  invalid: ParsedImportError[];
}

const kindMap: Record<string, ParsedImportLine["kind"]> = {
  entrada: "INCOME",
  income: "INCOME",
  in: "INCOME",
  saida: "EXPENSE",
  expense: "EXPENSE",
  out: "EXPENSE",
};

const recurringMap: Record<string, boolean> = {
  recorrente: true,
  sim: true,
  true: true,
  "1": true,
  nao: false,
  não: false,
  false: false,
  "0": false,
};

function isValidDayMonth(day: number, month: number): boolean {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  const maxByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= maxByMonth[month - 1]!;
}

export function parseTransactionImportText(input: string): ParsedImportResult {
  const valid: ParsedImportLine[] = [];
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
        reason: "FORMATO_INVALIDO_ESPERADO_7_TOKENS",
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

    const numericAmount = Number((amountToken ?? "").replace(",", "."));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      invalid.push({
        lineNumber,
        raw,
        reason: "VALOR_INVALIDO",
      });
      continue;
    }

    const recurring = recurringMap[(recurringToken ?? "").toLowerCase()];
    if (typeof recurring !== "boolean") {
      invalid.push({
        lineNumber,
        raw,
        reason: "RECORRENCIA_INVALIDA_USE_SIM_NAO",
      });
      continue;
    }

    valid.push({
      lineNumber,
      raw,
      dateToken: dateToken!,
      kind,
      description: description!,
      amount: numericAmount.toFixed(2),
      categoryToken: categoryToken!,
      accountToken: accountToken!,
      recurring,
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
