import { useEffect, useState } from "react";
import { Landmark, Pencil, Repeat2, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { formatCurrencyBR, formatDateBR, formatDateShortBR } from "../../lib/utils";

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
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);

    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

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
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700">
            {isDesktop ? (
              <div className="overflow-x-auto">
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
                    {entries.map((entry, index) => {
                      const categoryLabel = categoryLabels[entry.categoryId] ?? "Sem categoria";
                      const destinationLabel = entry.sourceType === "INVESTMENT"
                        ? `${accountLabels[entry.accountId ?? ""] ?? "Nao encontrada"} -> ${accountLabels[entry.destinationAccountId ?? ""] ?? "Nao encontrada"}`
                        : entry.accountId
                          ? `Conta: ${accountLabels[entry.accountId] ?? "Nao encontrada"}`
                          : `Cartao: ${cardLabels[entry.creditCardId ?? ""] ?? "Nao encontrado"}`;

                      return (
                        <tr key={entry.id} className={`row-animate ${index % 2 === 0 ? "bg-transparent" : "bg-slate-50/60 dark:bg-slate-900/40"}`}>
                          <td title={formatDateBR(entry.occurredAt)}>{formatDateShortBR(entry.occurredAt)}</td>
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
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Editar lancamento"
                                onClick={() => onEditEntry(entry)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {entries.map((entry, index) => {
                  const categoryLabel = categoryLabels[entry.categoryId] ?? "Sem categoria";
                  const destinationLabel = entry.sourceType === "INVESTMENT"
                    ? `${accountLabels[entry.accountId ?? ""] ?? "Nao encontrada"} -> ${accountLabels[entry.destinationAccountId ?? ""] ?? "Nao encontrada"}`
                    : entry.accountId
                      ? `Conta: ${accountLabels[entry.accountId] ?? "Nao encontrada"}`
                      : `Cartao: ${cardLabels[entry.creditCardId ?? ""] ?? "Nao encontrado"}`;

                  return (
                    <article key={entry.id} className={`row-animate rounded-xl border border-slate-200 p-3 dark:border-slate-700 ${index % 2 === 0 ? "" : "bg-slate-50/60 dark:bg-slate-900/40"}`}>
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold leading-tight">{entry.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300" title={formatDateBR(entry.occurredAt)}>
                            {formatDateShortBR(entry.occurredAt)}
                          </p>
                        </div>
                        {onEditEntry ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            aria-label="Editar lancamento"
                            onClick={() => onEditEntry(entry)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <TypeOriginCell entry={entry} />
                        <strong className="text-sm">{formatCurrencyBR(entry.amount)}</strong>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="normal-case tracking-normal">
                          {categoryLabel}
                        </Badge>
                        <Badge variant="outline" className="normal-case tracking-normal">
                          {destinationLabel}
                        </Badge>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
