import { useEffect, useState } from "react";
import { Check, Landmark, Loader2, Pencil, Repeat2, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

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
  sourceLabel?: "Avulso" | "Recorrente" | "Parcela" | "Investimento" | "Fatura";
  sourceType?: "ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT" | "INVOICE";
  sourceId?: string;
  scheduleInstanceId?: string;
  transferGroupId?: string | null;
  destinationAccountId?: string | null;
  paymentAccountId?: string | null;
  monthKey?: string;
  sequence?: number;
  settlementStatus?: "PAID" | "UNPAID" | null;
  systemTag?: "MONTH_CLOSE" | null;
}

interface StatementTableProps {
  entries: StatementEntry[];
  categoryLabels: Record<string, string>;
  accountLabels: Record<string, string>;
  cardLabels: Record<string, string>;
  onEditEntry?: (entry: StatementEntry) => void;
  onToggleSettlement?: (entry: StatementEntry) => void;
  loadingSettlementEntryId?: string | null;
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
  if (entry.systemTag === "MONTH_CLOSE") {
    return (
      <Badge variant="secondary" className="inline-flex items-center gap-1">
        <Check className="h-3.5 w-3.5" />
        Fechamento
      </Badge>
    );
  }

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

function compactTypeLabel(entry: StatementEntry) {
  if (entry.systemTag === "MONTH_CLOSE") return "Fechamento";
  if (entry.transferGroupId) return "Invest.";
  if (entry.sourceType === "RECURRING") return entry.kind === "INCOME" ? "Entrada recorr." : "Saida recorr.";
  if (entry.sourceType === "INSTALLMENT") return "Parcela";
  if (entry.sourceType === "INVOICE") return "Fatura";
  return entry.kind === "INCOME" ? "Entrada" : "Saida";
}

function compactTypeTone(entry: StatementEntry) {
  if (entry.systemTag === "MONTH_CLOSE") return "text-brand-teal";
  if (entry.sourceType === "INVOICE") return "text-rose-400";
  return entry.kind === "INCOME" ? "text-lime-300" : "text-rose-400";
}

function SettlementToggle({
  checked,
  onToggle,
  compact = false,
  loading = false,
}: {
  checked: boolean;
  onToggle: () => void;
  compact?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={loading ? "Atualizando quitacao" : checked ? "Marcar como nao pago" : "Marcar como pago"}
      aria-pressed={checked}
      disabled={loading}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`group inline-flex items-center justify-center border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/40 ${
        compact ? "h-6 w-6 rounded-[8px]" : "h-7 w-7 rounded-[10px]"
      } ${
        checked
          ? compact
            ? "border-brand-lime/50 bg-brand-lime/14 text-brand-lime"
            : "border-brand-lime/70 bg-brand-lime/20 text-brand-lime shadow-[0_0_0_1px_rgba(194,234,69,0.35),0_8px_18px_rgba(194,234,69,0.25)]"
          : "border-slate-300 bg-slate-100/70 text-slate-400 hover:border-slate-400 hover:bg-slate-200/70 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-500 dark:hover:border-slate-500"
      }`}
    >
      {loading ? (
        <Loader2 className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin`} />
      ) : (
        <Check
          className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} transition-all duration-200 ${
            checked ? "scale-100 opacity-100" : "scale-75 opacity-0 group-hover:scale-90 group-hover:opacity-60"
          }`}
        />
      )}
    </button>
  );
}

export function StatementTable({
  entries,
  categoryLabels,
  accountLabels,
  cardLabels,
  onEditEntry,
  onToggleSettlement,
  loadingSettlementEntryId = null,
}: StatementTableProps) {
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

  const canToggleSettlement = (entry: StatementEntry) =>
    Boolean(onToggleSettlement) && (entry.sourceType === "INVOICE" || (!!entry.accountId && !entry.transferGroupId));

  return (
    <section className="section-reveal min-w-0">
      {entries.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
          Nenhum lancamento no periodo atual.
        </p>
      ) : (
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
            {isDesktop ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200/70 dark:border-slate-700/70">
                      <th className="px-3 py-3 text-left">Pago</th>
                      <th className="px-3 py-3 text-left">Data</th>
                      <th className="px-3 py-3 text-left">Descricao</th>
                      <th className="px-3 py-3 text-left">Valor</th>
                      <th className="px-3 py-3 text-left">Tipo/Origem</th>
                      <th className="px-3 py-3 text-left">Categoria</th>
                      <th className="px-3 py-3 text-left">Destino</th>
                      <th className="px-3 py-3 text-left">Acoes</th>
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
                        <tr
                          key={entry.id}
                          className={`row-animate ${index % 2 === 0 ? "bg-transparent" : "bg-slate-50/60 dark:bg-slate-900/40"} ${entry.sourceType === "INVOICE" && onEditEntry ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            if (entry.sourceType === "INVOICE" && onEditEntry) {
                              onEditEntry(entry);
                            }
                          }}
                        >
                          <td className="px-3 py-3 align-middle">
                            {canToggleSettlement(entry) ? (
                              <SettlementToggle
                                loading={loadingSettlementEntryId === entry.id}
                                checked={entry.settlementStatus !== "UNPAID"}
                                onToggle={() => onToggleSettlement?.(entry)}
                              />
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 align-middle text-base" title={formatDateBR(entry.occurredAt)}>
                            {formatDateShortBR(entry.occurredAt)}
                          </td>
                          <td className="max-w-[280px] px-3 py-3 align-middle font-medium">{entry.description}</td>
                          <td className="whitespace-nowrap px-3 py-3 align-middle text-[1.05rem] font-semibold">{formatCurrencyBR(entry.amount)}</td>
                          <td className="px-3 py-3 align-middle">
                            <TypeOriginCell entry={entry} />
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <Badge variant="secondary" className="normal-case tracking-normal">
                              {categoryLabel}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 align-middle">
                            <Badge variant="outline" className="normal-case tracking-normal">
                              {destinationLabel}
                            </Badge>
                          </td>
                          <td className="px-3 py-3 align-middle">
                            {onEditEntry && entry.sourceType !== "INVOICE" ? (
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-[12px]">
                  <thead>
                    <tr className="border-b border-slate-200/70 bg-slate-100/80 text-[10px] uppercase tracking-[0.12em] text-slate-500 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                      <th className="w-9 px-2 py-2 text-left font-bold">Pg</th>
                      <th className="w-14 px-2 py-2 text-left font-bold">Data</th>
                      <th className="min-w-[150px] px-2 py-2 text-left font-bold">Desc.</th>
                      <th className="w-24 px-2 py-2 text-left font-bold">Tipo</th>
                      <th className="w-28 px-2 py-2 text-left font-bold">Conta</th>
                      <th className="w-24 px-2 py-2 text-right font-bold">Valor</th>
                      <th className="w-10 px-2 py-2 text-right font-bold">Edit</th>
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
                      const compactType = compactTypeLabel(entry);

                      return (
                        <tr
                          key={entry.id}
                          className={`row-animate border-b border-slate-200/60 last:border-b-0 dark:border-slate-800/80 ${entry.sourceType === "INVOICE" && onEditEntry ? "cursor-pointer" : ""}`}
                          onClick={() => {
                            if (entry.sourceType === "INVOICE" && onEditEntry) {
                              onEditEntry(entry);
                            }
                          }}
                        >
                          <td className="px-2 py-1.5 align-middle">
                            {canToggleSettlement(entry) ? (
                              <SettlementToggle
                                compact
                                loading={loadingSettlementEntryId === entry.id}
                                checked={entry.settlementStatus !== "UNPAID"}
                                onToggle={() => onToggleSettlement?.(entry)}
                              />
                            ) : (
                              <span className="inline-flex h-6 w-6 items-center justify-center text-xs text-slate-500">—</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 align-middle font-medium text-slate-500 dark:text-slate-300" title={formatDateBR(entry.occurredAt)}>
                            {formatDateShortBR(entry.occurredAt)}
                          </td>
                          <td className="max-w-[170px] truncate px-2 py-1.5 align-middle font-semibold text-slate-900 dark:text-slate-100">
                            {entry.description}
                          </td>
                          <td className="px-2 py-1.5 align-middle">
                            <span className={`block truncate text-[10px] font-bold uppercase tracking-[0.08em] ${compactTypeTone(entry)}`} title={categoryLabel}>
                              {compactType}
                            </span>
                          </td>
                          <td className="max-w-[120px] truncate px-2 py-1.5 align-middle text-slate-500 dark:text-slate-300" title={destinationLabel}>
                            {destinationLabel}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 text-right align-middle text-[13px] font-bold tabular-nums">
                            {formatCurrencyBR(entry.amount)}
                          </td>
                          <td className="px-2 py-1.5 text-right align-middle">
                            {onEditEntry && entry.sourceType !== "INVOICE" ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                aria-label="Editar lancamento"
                                className="h-7 w-7 rounded-lg"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  onEditEntry(entry);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}
    </section>
  );
}
