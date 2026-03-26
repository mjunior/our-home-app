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

function getDefaultOccurredDate(month: string): string {
  if (/^\d{4}-\d{2}$/.test(month)) {
    return `${month}-01`;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const monthValue = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dayValue = String(now.getUTCDate()).padStart(2, "0");
  return `${year}-${monthValue}-${dayValue}`;
}

function resolveScheduleStartMonth(input: { occurredAt: string; targetType: "account" | "card"; matchedCard?: AccountOption }): string {
  const defaultMonth = input.occurredAt.slice(0, 7);
  if (input.targetType !== "card" || !input.matchedCard) {
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

export function TransactionImportForm({ householdId, month, accounts, cards, categories, onSubmitBatch }: TransactionImportFormProps) {
  const [targetType, setTargetType] = useState<"account" | "card">("account");
  const [targetId, setTargetId] = useState<string>(accounts[0]?.id ?? cards[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? "");
  const [occurredDate, setOccurredDate] = useState<string>(getDefaultOccurredDate(month));
  const [textValue, setTextValue] = useState("");
  const [lineErrors, setLineErrors] = useState<ParsedImportError[]>([]);
  const [payloads, setPayloads] = useState<UnifiedLaunchPayload[]>([]);
  const [processed, setProcessed] = useState(false);
  const [batchResult, setBatchResult] = useState<ImportBatchResult | null>(null);

  const totalLines = useMemo(() => textValue.split(/\r?\n/).filter((line) => line.trim().length > 0).length, [textValue]);
  const targetOptions = targetType === "account" ? accounts : cards;

  function buildPayloads(): BuildPayloadResult {
    const parsed = parseTransactionImportText(textValue);
    const prepared: UnifiedLaunchPayload[] = [];
    const extraErrors: ParsedImportError[] = [];

    if (!targetId) {
      extraErrors.push({ lineNumber: 0, raw: "", reason: "CONTA_OU_CARTAO_OBRIGATORIO" });
    }

    if (!categoryId) {
      extraErrors.push({ lineNumber: 0, raw: "", reason: "CATEGORIA_OBRIGATORIA" });
    }

    const occurredAt = toIsoDateAtNoon(occurredDate);
    const matchedCard = targetType === "card" ? cards.find((item) => item.id === targetId) : undefined;
    const startMonth = resolveScheduleStartMonth({ occurredAt, targetType, matchedCard });

    for (const line of parsed.valid) {
      if (line.valueMode === "INSTALLMENT") {
        prepared.push({
          launchType: "INSTALLMENT",
          installment: {
            householdId,
            description: line.description,
            totalAmount: line.totalAmount,
            installmentsCount: line.installmentsCount,
            startMonth,
            categoryId,
            accountId: targetType === "account" ? targetId : undefined,
            creditCardId: targetType === "card" ? targetId : undefined,
          },
        });
        continue;
      }

      if (line.recurring) {
        prepared.push({
          launchType: "RECURRING",
          recurring: {
            householdId,
            kind: "EXPENSE",
            description: line.description,
            amount: line.amount,
            startMonth,
            categoryId,
            accountId: targetType === "account" ? targetId : undefined,
            creditCardId: targetType === "card" ? targetId : undefined,
          },
        });
        continue;
      }

      prepared.push({
        launchType: "ONE_OFF",
        transaction: {
          householdId,
          kind: "EXPENSE",
          description: line.description,
          amount: line.amount,
          occurredAt,
          categoryId,
          accountId: targetType === "account" ? targetId : undefined,
          creditCardId: targetType === "card" ? targetId : undefined,
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
    if (payloads.length === 0) return;
    const result = onSubmitBatch(payloads);
    setBatchResult(result);
  }

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>Importacao por texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm">
            Destino
            <select
              aria-label="Destino da importacao"
              value={targetType}
              onChange={(event) => {
                const nextType = event.target.value as "account" | "card";
                setTargetType(nextType);
                setTargetId(nextType === "account" ? (accounts[0]?.id ?? "") : (cards[0]?.id ?? ""));
              }}
            >
              <option value="account">Conta</option>
              <option value="card">Cartao</option>
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            {targetType === "account" ? "Conta" : "Cartao"}
            <select aria-label="Conta ou cartao da importacao" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
              {targetOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 text-sm">
            Categoria
            <select aria-label="Categoria da importacao" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
              {categories.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="grid gap-1 text-sm">
          Data das transacoes
          <input aria-label="Data da importacao" type="date" value={occurredDate} onChange={(event) => setOccurredDate(event.target.value)} />
        </label>

        <label className="grid gap-1 text-sm">
          Linhas de importacao
          <textarea
            aria-label="Linhas de importacao"
            rows={16}
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
            placeholder="compra mercado 50.00\ncelular 50.22*3\nnotebook 150/3 recorrente"
            className="min-h-[44vh] w-full resize-y rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-teal dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <details className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-300">
          <summary className="cursor-pointer select-none text-sm font-medium text-slate-700 dark:text-slate-100">Ajuda do formato</summary>
          <div className="mt-2 space-y-2">
            <p>
              Cole uma transacao por linha no formato: <strong className="ml-1">descricao valor [recorrente]</strong>
            </p>
            <p>
              Valor numerico puro = nao parcelado (aceita negativo, ex.: <code>-120.50</code>). Parcelado: <code>50.22*3</code> (3x de 50.22) ou{' '}
              <code>150/3</code> (total 150 em 3x).
            </p>
            <p>
              Recorrencia opcional: <code>recorrente</code>, <code>sim</code>, <code>r</code> ou <code>mensal</code>.
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
                {lineErrors.map((error, index) => (
                  <li key={`${error.lineNumber}-${error.reason}-${index}`}>
                    {error.lineNumber > 0 ? `Linha ${error.lineNumber}:` : "Config:"} {error.reason}
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
