import { useMemo, useState } from "react";

import { parseTransactionImportText, toIsoDateAtNoon, type ParsedImportError } from "../../modules/transactions/transaction-import.parser";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type { UnifiedLaunchPayload } from "./unified-launch-form";

interface AccountOption {
  id: string;
  label: string;
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
            startMonth: occurredAt.slice(0, 7),
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
        <p className="text-sm text-slate-500 dark:text-slate-300">
          Cole uma transacao por linha no formato:
          <strong className="ml-1">data tipo descricao valor categoria conta recorrente</strong>
        </p>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
          Exemplo: <code>01/02 saida compra_bahamas 50.00 mercado c6 recorrente</code>
        </div>

        <label className="grid gap-1 text-sm">
          Linhas de importacao
          <textarea
            aria-label="Linhas de importacao"
            rows={8}
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            placeholder="01/03 entrada salario 5000.00 renda conta_principal nao"
            className="w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

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
