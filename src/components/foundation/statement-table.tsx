import { Landmark, Repeat2, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { formatCurrencyBR, formatDateBR } from "../../lib/utils";

export interface StatementEntry {
  id: string;
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  occurredAt: string;
  categoryId: string;
  accountId: string | null;
  creditCardId: string | null;
  sourceLabel?: "Avulso" | "Recorrente" | "Parcela" | "Investimento";
  sourceType?: "ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT";
  sourceId?: string;
  transferGroupId?: string | null;
  destinationAccountId?: string | null;
  monthKey?: string;
  sequence?: number;
}

interface StatementTableProps {
  entries: StatementEntry[];
  categoryLabels: Record<string, string>;
  accountLabels: Record<string, string>;
  cardLabels: Record<string, string>;
  onEditEntry?: (entry: StatementEntry) => void;
}

function KindPill({ kind, isInvestment }: { kind: StatementEntry["kind"]; isInvestment?: boolean }) {
  if (isInvestment) {
    return (
      <Badge variant="secondary" className="inline-flex items-center gap-1">
        <Landmark className="h-3.5 w-3.5" />
        Investimento
      </Badge>
    );
  }

  if (kind === "INCOME") {
    return <Badge variant="lime">Entrada</Badge>;
  }

  return <Badge variant="destructive">Saida</Badge>;
}

function TypeOriginCell({ entry }: { entry: StatementEntry }) {
  const isInvestment = Boolean(entry.transferGroupId);
  const isRecurring = entry.sourceType === "RECURRING";
  const isInstallment = entry.sourceType === "INSTALLMENT";

  if (isInvestment) {
    return <KindPill kind={entry.kind} isInvestment />;
  }

  if (isRecurring) {
    return (
      <Badge variant={entry.kind === "INCOME" ? "lime" : "destructive"} className="inline-flex items-center gap-1">
        <Repeat2 className="h-3.5 w-3.5" />
        {entry.kind === "INCOME" ? "Entrada" : "Saida"}
      </Badge>
    );
  }

  if (isInstallment) {
    return (
      <Badge variant={entry.kind === "INCOME" ? "lime" : "destructive"} className="inline-flex items-center gap-1">
        {entry.kind === "INCOME" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
        {entry.kind === "INCOME" ? "Entrada" : "Saida"}
      </Badge>
    );
  }

  return <KindPill kind={entry.kind} />;
}

export function StatementTable({ entries, categoryLabels, accountLabels, cardLabels, onEditEntry }: StatementTableProps) {
  return (
    <Card className="section-reveal overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Extrato do Mes</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            Nenhum lancamento no periodo atual.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descricao</th>
                  <th>Valor</th>
                  <th>Tipo/Origem</th>
                  <th>Categoria</th>
                  <th>Destino</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const categoryLabel = categoryLabels[entry.categoryId] ?? "Sem categoria";
                  const destinationLabel = entry.sourceType === "INVESTMENT"
                    ? `${accountLabels[entry.accountId ?? ""] ?? "Nao encontrada"} -> ${accountLabels[entry.destinationAccountId ?? ""] ?? "Nao encontrada"}`
                    : entry.accountId
                      ? `Conta: ${accountLabels[entry.accountId] ?? "Nao encontrada"}`
                      : `Cartao: ${cardLabels[entry.creditCardId ?? ""] ?? "Nao encontrado"}`;

                  return (
                    <tr key={entry.id} className="row-animate">
                      <td>{formatDateBR(entry.occurredAt)}</td>
                      <td className="font-medium">{entry.description}</td>
                      <td className="font-semibold">{formatCurrencyBR(entry.amount)}</td>
                      <td>
                        <TypeOriginCell entry={entry} />
                      </td>
                      <td>
                        <Badge variant="secondary" className="normal-case tracking-normal">
                          {categoryLabel}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant="outline" className="normal-case tracking-normal">
                          {destinationLabel}
                        </Badge>
                      </td>
                      <td>
                        {onEditEntry ? (
                          <button
                            type="button"
                            className="rounded-md border px-2 py-1 text-xs"
                            onClick={() => onEditEntry(entry)}
                          >
                            Editar
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
