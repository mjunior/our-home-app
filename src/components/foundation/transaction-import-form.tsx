import { useMemo, useState } from "react";

import { InvoiceCycleService } from "../../modules/invoices/invoice-cycle.service";
import { parseTransactionImportText, toIsoDateAtNoon, type ParsedImportError } from "../../modules/transactions/transaction-import.parser";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { UnifiedLaunchPayload } from "./unified-launch-form";

interface AccountOption {
  id: string;
  label: string;
  closeDay?: number;
  dueDay?: number;
}

interface CategoryOption {
  id: string;
  label: string;
  normalized?: string;
}

interface ImportBatchResult {
  total: number;
  created: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
}

interface TransactionImportFormProps {
  householdId: string;
  month: string;
  accounts: AccountOption[];
  cards: AccountOption[];
  categories: CategoryOption[];
  onSubmitBatch: (payloads: UnifiedLaunchPayload[]) => ImportBatchResult;
}

interface BuildPayloadResult {
  payloads: UnifiedLaunchPayload[];
  errors: ParsedImportError[];
}

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function resolveByToken(token: string, options: AccountOption[]): AccountOption | null {
  const normalizedToken = normalizeToken(token);
  const exact = options.find((item) => normalizeToken(item.label) === normalizedToken);
  if (exact) return exact;

  const partialMatches = options.filter((item) => {
    const normalizedLabel = normalizeToken(item.label);
    return normalizedLabel.includes(normalizedToken) || normalizedToken.includes(normalizedLabel);
  });

  if (partialMatches.length === 1) {
    return partialMatches[0] ?? null;
  }

  return null;
}

function resolveCategory(token: string, options: CategoryOption[]): CategoryOption | null {
  const normalizedToken = normalizeToken(token);

  const byNormalized = options.find((item) => normalizeToken(item.normalized ?? "") === normalizedToken);
  if (byNormalized) return byNormalized;

  const byName = options.find((item) => normalizeToken(item.label) === normalizedToken);
  if (byName) return byName;

  const partialMatches = options.filter((item) => {
    const normalizedLabel = normalizeToken(item.label);
    const normalizedField = normalizeToken(item.normalized ?? "");
    return (
      normalizedLabel.includes(normalizedToken) ||
      normalizedToken.includes(normalizedLabel) ||
      normalizedField.includes(normalizedToken) ||
      normalizedToken.includes(normalizedField)
    );
  });

  if (partialMatches.length === 1) {
    return partialMatches[0] ?? null;
  }

  return null;
}

function resolveScheduleStartMonth(input: {
  occurredAt: string;
  kind: "INCOME" | "EXPENSE";
  matchedAccount: AccountOption | null;
  matchedCard: AccountOption | null;
}): string {
  const defaultMonth = input.occurredAt.slice(0, 7);
  if (input.kind !== "EXPENSE" || input.matchedAccount || !input.matchedCard) {
    return defaultMonth;
  }

  const closeDay = input.matchedCard.closeDay;
  const dueDay = input.matchedCard.dueDay;
  if (!closeDay || !dueDay) {
    return defaultMonth;
  }

  const cycle = new InvoiceCycleService().resolveExpenseCycle(input.occurredAt, closeDay, dueDay);
  return cycle.monthKey;
}

export function TransactionImportForm({
  householdId,
  month,
  accounts,
  cards,
  categories,
  onSubmitBatch,
}: TransactionImportFormProps) {
  const [textValue, setTextValue] = useState("");
  const [lineErrors, setLineErrors] = useState<ParsedImportError[]>([]);
  const [payloads, setPayloads] = useState<UnifiedLaunchPayload[]>([]);
  const [processed, setProcessed] = useState(false);
  const [batchResult, setBatchResult] = useState<ImportBatchResult | null>(null);

  const totalLines = useMemo(
    () => textValue.split(/\r?\n/).filter((line) => line.trim().length > 0).length,
    [textValue],
  );

  function buildPayloads(): BuildPayloadResult {
    const parsed = parseTransactionImportText(textValue);
    const referenceYear = Number(month.split("-")[0]) || new Date().getUTCFullYear();
    const prepared: UnifiedLaunchPayload[] = [];
    const extraErrors: ParsedImportError[] = [];

    for (const line of parsed.valid) {
      const category = resolveCategory(line.categoryToken, categories);
      if (!category) {
        extraErrors.push({
          lineNumber: line.lineNumber,
          raw: line.raw,
          reason: "CATEGORIA_NAO_ENCONTRADA",
        });
        continue;
      }

      const matchedAccount = resolveByToken(line.accountToken, accounts);
      const matchedCard = resolveByToken(line.accountToken, cards);

      if (!matchedAccount && !matchedCard) {
        extraErrors.push({
          lineNumber: line.lineNumber,
          raw: line.raw,
          reason: "CONTA_OU_CARTAO_NAO_ENCONTRADO",
        });
        continue;
      }

      const occurredAt = toIsoDateAtNoon(line.dateToken, referenceYear);
      const startMonth = resolveScheduleStartMonth({
        occurredAt,
        kind: line.kind,
        matchedAccount,
        matchedCard,
      });

      if (line.valueMode === "INSTALLMENT") {
        prepared.push({
          launchType: "INSTALLMENT",
          installment: {
            householdId,
            description: line.description.replaceAll("_", " "),
            totalAmount: line.totalAmount,
            installmentsCount: line.installmentsCount,
            startMonth,
            categoryId: category.id,
            accountId: matchedAccount?.id,
            creditCardId: matchedAccount ? undefined : matchedCard?.id,
          },
        });
        continue;
      }

      if (line.recurring) {
        if (line.kind === "INCOME" && !matchedAccount) {
          extraErrors.push({
            lineNumber: line.lineNumber,
            raw: line.raw,
            reason: "ENTRADA_RECORRENTE_EXIGE_CONTA",
          });
          continue;
        }

        prepared.push({
          launchType: "RECURRING",
          recurring: {
            householdId,
            kind: line.kind,
            description: line.description.replaceAll("_", " "),
            amount: line.amount,
            startMonth,
            categoryId: category.id,
            accountId: matchedAccount?.id,
            creditCardId: matchedAccount ? undefined : matchedCard?.id,
          },
        });
        continue;
      }

      if (line.kind === "INCOME" && !matchedAccount) {
        extraErrors.push({
          lineNumber: line.lineNumber,
          raw: line.raw,
          reason: "ENTRADA_EXIGE_CONTA",
        });
        continue;
      }

      prepared.push({
        launchType: "ONE_OFF",
        transaction: {
          householdId,
          kind: line.kind,
          description: line.description.replaceAll("_", " "),
          amount: line.amount,
          occurredAt,
          categoryId: category.id,
          accountId: matchedAccount?.id,
          creditCardId: matchedAccount ? undefined : matchedCard?.id,
        },
      });
    }

    return {
      payloads: prepared,
      errors: [...parsed.invalid, ...extraErrors].sort((a, b) => a.lineNumber - b.lineNumber),
    };
  }

  function handleProcess() {
    const next = buildPayloads();
    setPayloads(next.payloads);
    setLineErrors(next.errors);
    setBatchResult(null);
    setProcessed(true);
  }

  function handleImport() {
    if (payloads.length === 0) {
      return;
    }
    const result = onSubmitBatch(payloads);
    setBatchResult(result);
  }

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>Importacao por texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="grid gap-1 text-sm">
          Linhas de importacao
          <textarea
            aria-label="Linhas de importacao"
            rows={16}
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            placeholder="01/03 entrada salario 5000.00 renda conta_principal nao"
            className="min-h-[44vh] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-100">
            Ajuda do formato
          </summary>
          <div className="mt-2 space-y-2">
            <p>
              Cole uma transacao por linha no formato:
              <strong className="ml-1">data tipo descricao valor categoria conta recorrente</strong>
            </p>
            <p>
              Valor numerico puro = nao parcelado (aceita negativo, ex.: <code>-120.50</code>). Parcelado: <code>50.22x3</code> (3x de 50.22) ou{" "}
              <code>150/3</code> (total 150 em 3x).
            </p>
            <p>
              Exemplos: <code>01/02 saida compra_bahamas 50.00 mercado c6 nao</code>, <code>01/02 saida celular 50.22x3 mercado c6 nao</code>,{" "}
              <code>01/02 saida notebook 150/3 mercado c6 nao</code>
            </p>
          </div>
        </details>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleProcess}>
            Processar linhas
          </Button>
          <Button type="button" variant="outline" onClick={() => setTextValue("")}>
            Limpar
          </Button>
        </div>

        {processed ? (
          <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Linhas: {totalLines}</Badge>
              <Badge variant="lime">Validas: {payloads.length}</Badge>
              <Badge variant={lineErrors.length > 0 ? "destructive" : "secondary"}>Invalidas: {lineErrors.length}</Badge>
            </div>

            {lineErrors.length > 0 ? (
              <ul className="space-y-1 text-xs text-red-500">
                {lineErrors.map((error) => (
                  <li key={`${error.lineNumber}-${error.reason}`}>
                    Linha {error.lineNumber}: {error.reason}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Button type="button" variant="lime" onClick={handleImport} disabled={payloads.length === 0}>
          Importar lancamentos validos
        </Button>

        {batchResult ? (
          <div className="space-y-1 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p>
              Importacao finalizada: <strong>{batchResult.created}</strong> importados, <strong>{batchResult.failed}</strong> rejeitados.
            </p>
            {batchResult.errors.length > 0 ? (
              <ul className="space-y-1 text-xs text-red-500">
                {batchResult.errors.map((error) => (
                  <li key={`${error.index}-${error.error}`}>
                    Item {error.index + 1}: {error.error}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
