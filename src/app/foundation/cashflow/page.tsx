import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

import { MonthCloseSheet } from "../../../components/foundation/month-close-sheet";
import { StatementTable } from "../../../components/foundation/statement-table";
import { TransactionImportForm } from "../../../components/foundation/transaction-import-form";
import { UnifiedLaunchForm } from "../../../components/foundation/unified-launch-form";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { launchConfettiCanvas, playCashRegisterSound, playCheerSound } from "../../../lib/celebration";
import { currencyInputToDecimal, formatCurrencyBR, formatCurrencyInputBRL, formatMonthLabelBR, getCurrentMonthKeyLocal } from "../../../lib/utils";
import type { RecurringEditScope } from "../../../modules/scheduling/schedule-management.service";
import {
  accountsController,
  cardsController,
  categoriesController,
  freeBalanceController,
  invoicesController,
  monthCloseController,
  scheduleManagementController,
  transactionsController,
  getRuntimeHouseholdId,
} from "../runtime";
import type { MonthClosePreview } from "../../../modules/month-close/month-close.service";

function addMonths(monthKey: string, count: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

function toCurrencyDraftMap(entries: Array<{ id: string; value: string }>) {
  return Object.fromEntries(entries.map((item) => [item.id, formatCurrencyInputBRL(item.value, { allowNegative: true })]));
}

function toDecimalRecord(values: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value.trim() !== "")
      .map(([key, value]) => [key, currencyInputToDecimal(value, { allowNegative: true })]),
  );
}

export default function CashflowPage() {
  const [currentMonthKey] = useState(() => getCurrentMonthKeyLocal());
  const statementSectionRef = useRef<HTMLDivElement | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionFormResetKey, setTransactionFormResetKey] = useState(0);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [month, setMonth] = useState(currentMonthKey);
  const [editMode, setEditMode] = useState<"ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT" | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingTransferGroupId, setEditingTransferGroupId] = useState<string | null>(null);
  const [editingSourceMonth, setEditingSourceMonth] = useState<string>(() => getCurrentMonthKeyLocal());
  const [editKind, setEditKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editOccurredAt, setEditOccurredAt] = useState(() => `${getCurrentMonthKeyLocal()}-01`);
  const [editTarget, setEditTarget] = useState<"account" | "card">("account");
  const [editTargetId, setEditTargetId] = useState("");
  const [editInvestmentSourceId, setEditInvestmentSourceId] = useState("");
  const [editInvestmentDestinationId, setEditInvestmentDestinationId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editSettlementStatus, setEditSettlementStatus] = useState<"PAID" | "UNPAID">("PAID");
  const [loadingSettlementEntryId, setLoadingSettlementEntryId] = useState<string | null>(null);
  const [optimisticSettlementByEntryId, setOptimisticSettlementByEntryId] = useState<Record<string, "PAID" | "UNPAID">>({});
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"CURRENT_AND_FUTURE" | "ALL">("CURRENT_AND_FUTURE");
  const [editRecurringScope, setEditRecurringScope] = useState<RecurringEditScope>("THIS_ONLY");
  const [monthCloseModalOpen, setMonthCloseModalOpen] = useState(false);
  const [monthCloseMonth, setMonthCloseMonth] = useState(month);
  const [monthCloseAccountInputs, setMonthCloseAccountInputs] = useState<Record<string, string>>({});
  const [monthClosePreview, setMonthClosePreview] = useState<MonthClosePreview | null>(null);
  const [monthCloseSubmitting, setMonthCloseSubmitting] = useState(false);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const projectionRailRef = useRef<HTMLDivElement | null>(null);

  const accounts = useMemo(() => accountsController.listAccounts(householdId), [refreshKey, householdId]);
  const consolidatedBalance = useMemo(
    () => accountsController.getConsolidatedBalance(householdId),
    [refreshKey, householdId],
  );
  const cards = useMemo(() => cardsController.listCards(householdId), [refreshKey, householdId]);
  const categories = useMemo(() => categoriesController.listCategories(householdId), [refreshKey, householdId]);

  const accountLabels = useMemo(
    () => Object.fromEntries(accounts.map((item) => [item.id, item.name])),
    [accounts],
  );
  const cardLabels = useMemo(
    () => Object.fromEntries(cards.map((item) => [item.id, item.name])),
    [cards],
  );
  const cardDueDayMap = useMemo(
    () => Object.fromEntries(cards.map((item) => [item.id, item.dueDay])),
    [cards],
  );
  const categoryLabels = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.id, item.name])),
    [categories],
  );
  const categoryLabelsWithInvoice = useMemo(
    () => ({ ...categoryLabels, __invoice__: "Fatura" }),
    [categoryLabels],
  );

  const transactions = useMemo(
    () =>
      transactionsController.listTransactionsByMonth({
        householdId: householdId,
        month,
      }),
    [refreshKey, month, householdId],
  );

  const scheduleInstances = useMemo(
    () => scheduleManagementController.listMonthInstances({ householdId: householdId, month }),
    [refreshKey, month, householdId],
  );
  const dueObligations = useMemo(
    () => invoicesController.getDueObligationsByMonth({ householdId, dueMonth: month }),
    [refreshKey, month, householdId],
  );
  const statementEntries = useMemo(() => {
    const oneOff = transactions
      .filter((item) => !item.transferGroupId && !(item.kind === "EXPENSE" && item.creditCardId))
      .map((item) => ({
        ...item,
        sourceLabel: "Avulso" as const,
        sourceType: "ONE_OFF" as const,
      }));

    const invoices = dueObligations.cards.map((item) => {
      const dueDay = cardDueDayMap[item.cardId] ?? 1;
      const occurredAt = `${month}-${String(dueDay).padStart(2, "0")}T12:00:00.000Z`;
      return {
        id: `invoice:${item.cardId}:${month}`,
        kind: "EXPENSE" as const,
        description: `Fatura ${item.cardName}`,
        amount: item.total,
        occurredAt,
        categoryId: "__invoice__",
        accountId: null,
        creditCardId: item.cardId,
        settlementStatus: item.paid ? ("PAID" as const) : ("UNPAID" as const),
        paymentAccountId: item.paymentAccountId ?? null,
        sourceLabel: "Fatura" as const,
        sourceType: "INVOICE" as const,
      };
    });

    const investmentsByGroup = new Map<
      string,
      {
        debit?: (typeof transactions)[number];
        credit?: (typeof transactions)[number];
      }
    >();
    for (const item of transactions) {
      if (!item.transferGroupId) continue;
      const group = investmentsByGroup.get(item.transferGroupId) ?? {};
      if (item.kind === "EXPENSE") group.debit = item;
      if (item.kind === "INCOME") group.credit = item;
      investmentsByGroup.set(item.transferGroupId, group);
    }

    const investments = Array.from(investmentsByGroup.entries())
      .filter(([, pair]) => pair.debit && pair.credit)
      .map(([transferGroupId, pair]) => ({
        id: `investment:${transferGroupId}`,
        kind: "EXPENSE" as const,
        description: pair.debit!.description,
        amount: pair.debit!.amount,
        occurredAt: pair.debit!.occurredAt,
        categoryId: pair.debit!.categoryId,
        accountId: pair.debit!.accountId,
        destinationAccountId: pair.credit!.accountId,
        creditCardId: null,
        transferGroupId,
        sourceLabel: "Investimento" as const,
        sourceType: "INVESTMENT" as const,
      }));

    const scheduled = scheduleInstances
      .filter((item) => item.creditCardId === null)
      .map((item) => ({
        id: `schedule:${item.id}`,
        scheduleInstanceId: item.id,
        kind: item.kind,
        description: item.sourceType === "INSTALLMENT" ? `${item.description} (${item.sequence})` : item.description,
        amount: item.amount,
        occurredAt: item.occurredAt,
        monthKey: item.monthKey,
        sourceId: item.sourceId,
        sequence: item.sequence,
        categoryId: item.categoryId,
        accountId: item.accountId,
        creditCardId: item.creditCardId,
        settlementStatus: item.settlementStatus ?? (item.accountId ? "PAID" : null),
        sourceLabel: item.sourceType === "INSTALLMENT" ? ("Parcela" as const) : ("Recorrente" as const),
        sourceType: item.sourceType,
      }));

    const all = [...oneOff, ...invoices, ...investments, ...scheduled].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    const sorted = all.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    return sorted.map((item) => {
      const optimistic = optimisticSettlementByEntryId[item.id];
      if (!optimistic) {
        return item;
      }
      return {
        ...item,
        settlementStatus: optimistic,
      };
    });
  }, [cardDueDayMap, cardLabels, dueObligations.cards, month, optimisticSettlementByEntryId, scheduleInstances, transactions]);

  const projectionStartMonth = `${currentMonthKey.slice(0, 4)}-01`;
  const projectionEndMonth = `${currentMonthKey.slice(0, 4)}-12`;
  const freeBalanceProjection = useMemo(
    () =>
      freeBalanceController.getFreeBalanceProjection({
        householdId,
        startMonth: projectionStartMonth,
        endMonth: projectionEndMonth,
      }),
    [householdId, projectionEndMonth, projectionStartMonth, refreshKey],
  );

  const selectedMonthData = useMemo(
    () => freeBalanceProjection.months.find((m) => m.month === month),
    [freeBalanceProjection.months, month],
  );

  useEffect(() => {
    const currentMonthButton = projectionRailRef.current?.querySelector<HTMLButtonElement>("[data-current-month='true']");
    if (typeof currentMonthButton?.scrollIntoView === "function") {
      currentMonthButton.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [currentMonthKey, freeBalanceProjection.months]);

  useEffect(() => {
    const openLaunch = () => handleOpenTransactionModal();
    const openImport = () => setImportModalOpen(true);
    window.addEventListener("cashflow:new-launch", openLaunch);
    window.addEventListener("cashflow:import-launch", openImport);
    return () => {
      window.removeEventListener("cashflow:new-launch", openLaunch);
      window.removeEventListener("cashflow:import-launch", openImport);
    };
  }, []);

  useEffect(() => {
    if (!monthCloseModalOpen) {
      setMonthClosePreview(null);
      return;
    }

    setMonthClosePreview(
      monthCloseController.previewCloseMonth({
        householdId,
        month: monthCloseMonth,
        realAccountBalances: toDecimalRecord(monthCloseAccountInputs),
      }),
    );
  }, [householdId, monthCloseAccountInputs, monthCloseModalOpen, monthCloseMonth, refreshKey]);

  function handleMonthNavigation(offset: number) {
    setMonth(addMonths(month, offset));
  }

  function handleProjectionMonthSelect(monthKey: string) {
    setMonth(monthKey);
    window.requestAnimationFrame(() => {
      statementSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      statementSectionRef.current?.focus({ preventScroll: true });
    });
  }

  function handleOpenTransactionModal() {
    setTransactionFormResetKey((prev) => prev + 1);
    setTransactionModalOpen(true);
  }

  function handleOpenMonthCloseModal() {
    const monthCloseSeedPreview = monthCloseController.previewCloseMonth({
      householdId,
      month,
      realAccountBalances: toDecimalRecord(
        toCurrencyDraftMap(
          consolidatedBalance.accounts
            .filter((account) => account.type === "CHECKING")
            .map((account) => ({ id: account.id, value: account.balance })),
        ),
      ),
    });

    setMonthCloseMonth(month);
    setMonthCloseAccountInputs(
      toCurrencyDraftMap(
        monthCloseSeedPreview.accounts.map((account) => ({ id: account.accountId, value: account.appBalance })),
      ),
    );
    setMonthCloseModalOpen(true);
  }

  function handleAccountCloseChange(accountId: string, value: string) {
    setMonthCloseAccountInputs((prev) => ({
      ...prev,
      [accountId]: formatCurrencyInputBRL(value, { allowNegative: true }),
    }));
  }

  async function handleConfirmMonthClose() {
    setMonthCloseSubmitting(true);
    try {
      monthCloseController.confirmCloseMonth({
        householdId,
        month: monthCloseMonth,
        realAccountBalances: toDecimalRecord(monthCloseAccountInputs),
      });
      setMonthCloseModalOpen(false);
      setRefreshKey((prev) => prev + 1);
      notify({ message: "Mes fechado com sucesso.", tone: "success" });
    } catch {
      notify({ message: "Nao foi possivel fechar o mes.", tone: "error" });
    } finally {
      setMonthCloseSubmitting(false);
    }
  }

  return (
    <main className="min-w-0 space-y-4 pb-36 lg:pb-4">
      <section className="section-reveal hidden min-w-0 flex-col items-start gap-3 lg:flex lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <button
            type="button"
            aria-label="Novo lancamento"
            className="sr-only"
            onClick={handleOpenTransactionModal}
          >
            Novo lancamento
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Visao operacional</p>
          <p className="text-sm text-slate-500 dark:text-slate-300">Dashboard limpo com sinal de risco e extrato do mes.</p>
        </div>
      </section>

      <Card className="section-reveal min-w-0">
        <CardContent className="pt-5">
          <div className="flex min-w-0 flex-col gap-3">
            <div className="min-w-0 space-y-2.5 lg:space-y-0">
              <div className="cashflow-month-shell">
              <div className="cashflow-month-shell__header">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Competencia</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMonthLabelBR(month)}</p>
                  </div>
                  {selectedMonthData && (
                    <div className="flex gap-4 border-t border-slate-100 pt-1 sm:border-0 sm:pt-0">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500/70 dark:text-slate-300/70">Resultado</p>
                        <p className={`text-sm font-bold ${Number(selectedMonthData.operationalResult) < 0 ? "text-red-600 dark:text-red-400" : "text-brand-teal dark:text-brand-lime"}`}>
                          {formatCurrencyBR(selectedMonthData.operationalResult)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500/70 dark:text-slate-300/70">Saldo Final</p>
                        <p className={`text-sm font-bold ${Number(selectedMonthData.cumulativeBalance) < 0 ? "text-red-600 dark:text-red-400" : "text-brand-teal dark:text-brand-lime"}`}>
                          {formatCurrencyBR(selectedMonthData.cumulativeBalance)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                  <div className="cashflow-month-nav" aria-label="Navegacao mensal">
                    <button
                      type="button"
                      className="cashflow-month-nav__button"
                      aria-label="Ir para mes anterior"
                      onClick={() => handleMonthNavigation(-1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="cashflow-month-nav__button"
                      aria-label="Ir para proximo mes"
                      onClick={() => handleMonthNavigation(1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  className="mt-3 flex gap-3 overflow-x-auto pb-2"
                  role="tablist"
                  aria-label="Projecao mensal ate dezembro"
                  ref={projectionRailRef}
                >
                  {freeBalanceProjection.months.map((projectionMonth) => {
                    const monthItem = projectionMonth.month;
                    const active = monthItem === month;
                    const isCurrentMonth = monthItem === currentMonthKey;
                    return (
                      <button
                        key={monthItem}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={formatMonthLabelBR(monthItem)}
                        data-current-month={isCurrentMonth}
                        className={`min-w-[176px] rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-teal/45 ${
                          active
                            ? "border-brand-teal bg-brand-teal/10 shadow-sm dark:border-brand-lime dark:bg-brand-lime/10"
                            : "border-slate-200 bg-white/70 hover:border-brand-teal/50 hover:bg-white dark:border-slate-700 dark:bg-slate-950/60 dark:hover:border-brand-lime/50"
                        }`}
                        onClick={() => handleProjectionMonthSelect(monthItem)}
                      >
                        <span className="block text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">
                          {formatMonthLabelBR(monthItem)}
                        </span>
                        <span className="mt-2 grid gap-1 text-xs">
                          <span className="flex justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-300">Entradas</span>
                            <strong>{formatCurrencyBR(projectionMonth.entradas)}</strong>
                          </span>
                          <span className="flex justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-300">Saidas</span>
                            <strong>{formatCurrencyBR(projectionMonth.saidas)}</strong>
                          </span>
                          <span className="flex justify-between gap-2">
                            <span className="text-slate-500 dark:text-slate-300">Invest.</span>
                            <strong>{formatCurrencyBR(projectionMonth.investimentos)}</strong>
                          </span>
                          <div className="mt-1 grid gap-1 border-t border-slate-200 pt-1 dark:border-slate-700">
                            <span className="flex justify-between gap-2">
                              <span className="text-slate-700/70 dark:text-slate-200/70">Resultado</span>
                              <strong className={Number(projectionMonth.operationalResult) < 0 ? "text-red-600 dark:text-red-400" : "text-brand-teal dark:text-brand-lime"}>
                                {formatCurrencyBR(projectionMonth.operationalResult)}
                              </strong>
                            </span>
                            <span className="flex justify-between gap-2">
                              <span className="font-semibold text-slate-700 dark:text-slate-200">Saldo Final</span>
                              <strong className={Number(projectionMonth.cumulativeBalance) < 0 ? "text-red-600 dark:text-red-400" : "text-brand-teal dark:text-brand-lime"}>
                                {formatCurrencyBR(projectionMonth.cumulativeBalance)}
                              </strong>
                            </span>
                          </div>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto" onClick={handleOpenMonthCloseModal}>
                  <CheckCircle2 className="h-4 w-4" />
                  Fechar mes
                </Button>
                <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto" onClick={() => setImportModalOpen(true)}>
                  Importar texto
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={statementSectionRef} tabIndex={-1} className="scroll-mt-4 focus:outline-none">
        <StatementTable
          entries={statementEntries}
          accountLabels={accountLabels}
          cardLabels={cardLabels}
          categoryLabels={categoryLabelsWithInvoice}
          loadingSettlementEntryId={loadingSettlementEntryId}
          onEditEntry={(entry) => {
          if (entry.sourceType === "INVOICE") {
            window.dispatchEvent(
              new CustomEvent("app:navigate-route", {
                detail: {
                  route: "cards",
                  cardId: entry.creditCardId ?? undefined,
                  dueMonth: entry.occurredAt.slice(0, 7),
                },
              }),
            );
            return;
          }
          const isInvestment = entry.sourceType === "INVESTMENT";
          const isOneOff = entry.sourceType === "ONE_OFF";
          setEditMode(entry.sourceType ?? "ONE_OFF");
          setEditingEntryId(isOneOff || isInvestment ? entry.id : null);
          setEditingSourceId(!isOneOff && !isInvestment ? entry.sourceId ?? null : null);
          setEditingTransferGroupId(entry.transferGroupId ?? null);
          setEditingSourceMonth(entry.monthKey ?? month);
          setEditRecurringScope("THIS_ONLY");
          setDeleteScope("CURRENT_AND_FUTURE");
          setEditKind(entry.kind);
          setEditDescription(entry.description);
          setEditAmount(entry.amount);
          setEditOccurredAt(entry.occurredAt.slice(0, 10));
          if (isInvestment && entry.transferGroupId) {
            const pair = transactions.filter((item) => item.transferGroupId === entry.transferGroupId);
            const debit = pair.find((item) => item.kind === "EXPENSE");
            const credit = pair.find((item) => item.kind === "INCOME");
            setEditInvestmentSourceId(debit?.accountId ?? "");
            setEditInvestmentDestinationId(credit?.accountId ?? "");
          }
          if (entry.accountId) {
            setEditTarget("account");
            setEditTargetId(entry.accountId);
          } else {
            setEditTarget("card");
            setEditTargetId(entry.creditCardId ?? "");
          }
          setEditCategoryId(entry.categoryId);
          setEditSettlementStatus(entry.settlementStatus === "UNPAID" ? "UNPAID" : "PAID");
          setEditModalOpen(true);
          }}
          onToggleSettlement={(entry) => {
          if (loadingSettlementEntryId) {
            return;
          }
          const nextStatus: "PAID" | "UNPAID" = entry.settlementStatus === "UNPAID" ? "PAID" : "UNPAID";
          setOptimisticSettlementByEntryId((prev) => ({ ...prev, [entry.id]: nextStatus }));
          if (nextStatus === "PAID") {
            if (entry.sourceType === "INVOICE") {
              playCheerSound();
              launchConfettiCanvas();
            } else {
              playCashRegisterSound();
            }
          }
          setLoadingSettlementEntryId(entry.id);
          const runToggle = () => {
          try {
            if (entry.sourceType === "INVOICE") {
              if (!entry.creditCardId) {
                throw new Error("INVOICE_CARD_NOT_FOUND");
              }
              const dueMonth = entry.occurredAt.slice(0, 7);
              if (nextStatus === "PAID") {
                const paymentAccountId = entry.paymentAccountId ?? accounts[0]?.id;
                if (!paymentAccountId) {
                  throw new Error("PAYMENT_ACCOUNT_REQUIRED");
                }
                invoicesController.settleInvoice({
                  householdId,
                  cardId: entry.creditCardId,
                  dueMonth,
                  paymentAccountId,
                  paidAt: new Date().toISOString(),
                  paidAmount: entry.amount,
                });
              } else {
                invoicesController.unsettleInvoice({
                  householdId,
                  cardId: entry.creditCardId,
                  dueMonth,
                });
              }
            } else if ((entry.sourceType === "RECURRING" || entry.sourceType === "INSTALLMENT") && entry.accountId && !entry.transferGroupId) {
              if (!entry.scheduleInstanceId) {
                throw new Error("SCHEDULE_INSTANCE_NOT_FOUND");
              }
              scheduleManagementController.updateInstanceSettlement({
                instanceId: entry.scheduleInstanceId,
                settlementStatus: nextStatus,
              });
            } else if (entry.accountId && !entry.transferGroupId) {
              transactionsController.updateTransaction({
                id: entry.id,
                householdId: householdId,
                kind: entry.kind,
                description: entry.description,
                amount: entry.amount,
                occurredAt: entry.occurredAt,
                categoryId: entry.categoryId,
                accountId: entry.accountId,
                settlementStatus: nextStatus,
              });
            } else {
              return;
            }
            setOptimisticSettlementByEntryId((prev) => {
              const { [entry.id]: _removed, ...rest } = prev;
              return rest;
            });
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Status de quitacao atualizado.", tone: "success" });
          } catch {
            notify({ message: "Nao foi possivel atualizar o status.", tone: "error" });
          } finally {
            setLoadingSettlementEntryId(null);
          }
          };

          if (import.meta.env.MODE === "test") {
            runToggle();
            return;
          }

          window.setTimeout(runToggle, 16);
          }}
        />
      </div>

      <MonthCloseSheet
        open={monthCloseModalOpen}
        preview={monthClosePreview}
        isSubmitting={monthCloseSubmitting}
        onOpenChange={setMonthCloseModalOpen}
        onAccountChange={handleAccountCloseChange}
        onConfirm={handleConfirmMonthClose}
      />

      <Sheet open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Adicionar lancamento</SheetTitle>
            <SheetDescription>Registre entrada ou saida sem sair do dashboard.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <UnifiedLaunchForm
              resetKey={transactionFormResetKey}
              formId="cashflow-unified-launch-form"
              householdId={householdId}
              accounts={accounts.map((item) => ({ id: item.id, label: item.name, type: item.type }))}
              cards={cards.map((item) => ({ id: item.id, label: item.name }))}
              categories={categories.map((item) => ({ id: item.id, label: item.name }))}
              onSubmit={async (payload) => {
                try {
                  await scheduleManagementController.createLaunch(payload);
                  setRefreshKey((prev) => prev + 1);
                  setTransactionModalOpen(false);
                  notify({ message: "Lancamento cadastrado com sucesso.", tone: "success" });
                } catch (error) {
                  notify({ message: "Nao foi possivel cadastrar o lancamento.", tone: "error" });
                  throw error;
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={importModalOpen} onOpenChange={setImportModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Importar lancamentos por texto</SheetTitle>
            <SheetDescription>Cole varias linhas e importe apenas as validas.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <TransactionImportForm
              householdId={householdId}
              month={month}
              accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
              cards={cards.map((item) => ({ id: item.id, label: item.name, closeDay: item.closeDay, dueDay: item.dueDay }))}
              categories={categories.map((item) => ({ id: item.id, label: item.name, normalized: item.normalized }))}
              onSubmitBatch={(payloads) => {
                const result = scheduleManagementController.createLaunchBatch({ entries: payloads });
                if (result.created > 0) {
                  setRefreshKey((prev) => prev + 1);
                }
                notify({
                  message: `Importacao concluida: ${result.created} importados, ${result.failed} rejeitados.`,
                  tone: result.failed > 0 ? "info" : "success",
                });
                return result;
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={editModalOpen} onOpenChange={setEditModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Editar lancamento</SheetTitle>
            <SheetDescription>Atualize os campos e salve para recalcular o extrato.</SheetDescription>
          </SheetHeader>
          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                if (editMode === "ONE_OFF") {
                  if (!editingEntryId) {
                    throw new Error("TRANSACTION_NOT_SELECTED");
                  }
                  transactionsController.updateTransaction({
                    id: editingEntryId,
                    householdId: householdId,
                    kind: editKind,
                    description: editDescription,
                    amount: editAmount,
                    occurredAt: `${editOccurredAt}T12:00:00.000Z`,
                    categoryId: editCategoryId || categories[0]?.id || "",
                    accountId: editTarget === "account" ? editTargetId : undefined,
                    creditCardId: editTarget === "card" ? editTargetId : undefined,
                    settlementStatus: editTarget === "account" ? editSettlementStatus : undefined,
                  });
                } else if (editMode === "INVESTMENT") {
                  if (!editingTransferGroupId) {
                    throw new Error("INVESTMENT_NOT_SELECTED");
                  }
                  transactionsController.updateInvestmentTransfer({
                    householdId: householdId,
                    transferGroupId: editingTransferGroupId,
                    description: editDescription,
                    amount: editAmount,
                    occurredAt: `${editOccurredAt}T12:00:00.000Z`,
                    categoryId: editCategoryId || categories[0]?.id || "",
                    sourceAccountId: editInvestmentSourceId,
                    destinationAccountId: editInvestmentDestinationId,
                  });
                } else if (editMode === "RECURRING") {
                  if (!editingSourceId) {
                    throw new Error("RECURRING_NOT_SELECTED");
                  }
                  scheduleManagementController.editRecurringSchedule({
                    ruleId: editingSourceId,
                    effectiveMonth: editingSourceMonth,
                    scope: editRecurringScope,
                    kind: editKind,
                    description: editDescription,
                    amount: editAmount,
                  });
                } else if (editMode === "INSTALLMENT") {
                  if (!editingSourceId) {
                    throw new Error("INSTALLMENT_NOT_SELECTED");
                  }
                  scheduleManagementController.editInstallmentSchedule({
                    planId: editingSourceId,
                    effectiveMonth: editingSourceMonth,
                    kind: editKind,
                    description: editDescription,
                    amount: editAmount,
                  });
                }
                setRefreshKey((prev) => prev + 1);
                setEditModalOpen(false);
                notify({
                  message:
                    editMode === "RECURRING" && editRecurringScope === "THIS_ONLY"
                      ? "Edicao aplicada somente nesta ocorrencia."
                      : "Edicao aplicada no mes atual e futuras.",
                  tone: "success",
                });
              } catch {
                notify({ message: "Nao foi possivel editar o lancamento.", tone: "error" });
              }
            }}
          >
            {editMode === "ONE_OFF" || editMode === "INVESTMENT" ? (
              <div className="grid grid-cols-2 gap-3">
                {editMode === "ONE_OFF" ? (
                  <label>
                    Tipo da transacao
                    <select aria-label="Editar tipo da transacao" value={editKind} onChange={(event) => setEditKind(event.target.value as "INCOME" | "EXPENSE")}>
                      <option value="INCOME">Entrada</option>
                      <option value="EXPENSE">Saida</option>
                    </select>
                  </label>
                ) : (
                  <div className="rounded-lg border border-slate-200 p-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Investimento sempre altera debito e credito juntos.
                  </div>
                )}
                <label>
                  Data da transacao
                  <input aria-label="Editar data da transacao" type="date" value={editOccurredAt} onChange={(event) => setEditOccurredAt(event.target.value)} />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label>
                  Tipo da transacao
                  <select aria-label="Editar tipo da transacao" value={editKind} onChange={(event) => setEditKind(event.target.value as "INCOME" | "EXPENSE")}>
                    <option value="INCOME">Entrada</option>
                    <option value="EXPENSE">Saida</option>
                  </select>
                </label>
                {editMode === "RECURRING" ? (
                  <label>
                    Escopo da edicao recorrente
                    <select
                      aria-label="Escopo da edicao recorrente"
                      value={editRecurringScope}
                      onChange={(event) => setEditRecurringScope(event.target.value as RecurringEditScope)}
                    >
                      <option value="THIS_ONLY">Editar somente esta</option>
                      <option value="CURRENT_AND_FUTURE">Editar esta e futuras</option>
                    </select>
                  </label>
                ) : null}
                <label>
                  {editMode === "RECURRING" && editRecurringScope === "THIS_ONLY" ? "Mes da ocorrencia" : "Aplicar a partir do mes"}
                  <input
                    aria-label="Editar mes efetivo"
                    value={editingSourceMonth}
                    onChange={(event) => setEditingSourceMonth(event.target.value)}
                    readOnly={editMode === "RECURRING" && editRecurringScope === "THIS_ONLY"}
                  />
                </label>
              </div>
            )}

            <label>
              Descricao da transacao
              <input aria-label="Editar descricao da transacao" value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
            </label>

            <label>
              Valor da transacao
              <input aria-label="Editar valor da transacao" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} />
            </label>

            {editMode === "ONE_OFF" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    Destino da transacao
                    <select
                      aria-label="Editar destino da transacao"
                      value={editTarget}
                      onChange={(event) => {
                        const next = event.target.value as "account" | "card";
                        setEditTarget(next);
                        setEditTargetId(next === "account" ? accounts[0]?.id ?? "" : cards[0]?.id ?? "");
                      }}
                    >
                      <option value="account">Conta</option>
                      <option value="card">Cartao</option>
                    </select>
                  </label>
                  <label>
                    Opcao de destino
                    <select aria-label="Editar opcao de destino" value={editTargetId} onChange={(event) => setEditTargetId(event.target.value)}>
                      {(editTarget === "account" ? accounts : cards).map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label>
                  Categoria da transacao
                  <select aria-label="Editar categoria da transacao" value={editCategoryId} onChange={(event) => setEditCategoryId(event.target.value)}>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
                {editTarget === "account" ? (
                  <label>
                    Status da transacao
                    <select
                      aria-label="Editar status da transacao"
                      value={editSettlementStatus}
                      onChange={(event) => setEditSettlementStatus(event.target.value as "PAID" | "UNPAID")}
                    >
                      <option value="PAID">Pago/Recebido</option>
                      <option value="UNPAID">Nao pago/nao recebido</option>
                    </select>
                  </label>
                ) : null}
              </>
            ) : null}

            {editMode === "INVESTMENT" ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    Conta de origem
                    <select aria-label="Editar conta de origem" value={editInvestmentSourceId} onChange={(event) => setEditInvestmentSourceId(event.target.value)}>
                      {accounts
                        .filter((item) => item.type === "CHECKING")
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Conta de destino
                    <select
                      aria-label="Editar conta de destino"
                      value={editInvestmentDestinationId}
                      onChange={(event) => setEditInvestmentDestinationId(event.target.value)}
                    >
                      {accounts
                        .filter((item) => item.type === "INVESTMENT")
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                    </select>
                  </label>
                </div>

                <label>
                  Categoria da transacao
                  <select aria-label="Editar categoria da transacao" value={editCategoryId} onChange={(event) => setEditCategoryId(event.target.value)}>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editMode === "ONE_OFF"
                ? "Esta edicao altera apenas o lancamento selecionado."
                : editMode === "INVESTMENT"
                  ? "Esta edicao altera o par vinculado de investimento (debito e credito)."
                : editMode === "RECURRING" && editRecurringScope === "THIS_ONLY"
                  ? "Esta edicao altera apenas esta ocorrencia da recorrencia."
                : "Esta edicao altera o mes atual selecionado e todas as ocorrencias futuras."}
            </p>

            {editMode === "RECURRING" || editMode === "INSTALLMENT" ? (
              <label>
                Escopo de exclusao
                <select aria-label="Escopo de exclusao" value={deleteScope} onChange={(event) => setDeleteScope(event.target.value as "CURRENT_AND_FUTURE" | "ALL")}>
                  <option value="CURRENT_AND_FUTURE">Excluir atual + futuras</option>
                  <option value="ALL">Excluir todas (inclui antigas)</option>
                </select>
              </label>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <Button type="submit">Salvar edicao</Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  try {
                    if (editMode === "ONE_OFF") {
                      if (editingTransferGroupId) {
                        transactionsController.deleteInvestmentTransfer({
                          householdId: householdId,
                          transferGroupId: editingTransferGroupId,
                        });
                      } else {
                        if (!editingEntryId) {
                          throw new Error("TRANSACTION_NOT_SELECTED");
                        }
                        transactionsController.deleteTransaction({ id: editingEntryId, householdId: householdId });
                      }
                    } else if (editMode === "INVESTMENT") {
                      if (!editingTransferGroupId) {
                        throw new Error("INVESTMENT_NOT_SELECTED");
                      }
                      transactionsController.deleteInvestmentTransfer({
                        householdId: householdId,
                        transferGroupId: editingTransferGroupId,
                      });
                    } else if (editMode === "RECURRING") {
                      if (!editingSourceId) {
                        throw new Error("RECURRING_NOT_SELECTED");
                      }
                      scheduleManagementController.deleteRecurringSchedule({
                        ruleId: editingSourceId,
                        fromMonth: editingSourceMonth,
                        scope: deleteScope,
                      });
                    } else if (editMode === "INSTALLMENT") {
                      if (!editingSourceId) {
                        throw new Error("INSTALLMENT_NOT_SELECTED");
                      }
                      scheduleManagementController.deleteInstallmentSchedule({
                        planId: editingSourceId,
                        fromMonth: editingSourceMonth,
                        scope: deleteScope,
                      });
                    }
                    setRefreshKey((prev) => prev + 1);
                    setEditModalOpen(false);
                    notify({ message: "Lancamento excluido com sucesso.", tone: "info" });
                  } catch {
                    notify({ message: "Nao foi possivel excluir o lancamento.", tone: "error" });
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  );
}
