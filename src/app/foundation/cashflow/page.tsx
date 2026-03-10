import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { FreeBalanceSemaphore } from "../../../components/foundation/free-balance-semaphore";
import { StatementTable } from "../../../components/foundation/statement-table";
import { TransactionImportForm } from "../../../components/foundation/transaction-import-form";
import { UnifiedLaunchForm } from "../../../components/foundation/unified-launch-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { launchConfettiCanvas, playCashRegisterSound, playCheerSound } from "../../../lib/celebration";
import { formatCurrencyBR, formatMonthLabelBR } from "../../../lib/utils";
import type { RecurringEditScope } from "../../../modules/scheduling/schedule-management.service";
import {
  accountsController,
  cardsController,
  categoriesController,
  freeBalanceController,
  invoicesController,
  scheduleManagementController,
  transactionsController,
  getRuntimeHouseholdId,
} from "../runtime";

const breakdownLabels: Record<string, string> = {
  accountStartingBalance: "Saldo de contas",
  projectedIncome: "Entradas previstas",
  cardInvoiceDue: "Fatura de cartao",
  installments: "Parcelas",
  recurrences: "Recorrencias",
  oneOffExpenses: "Gastos extras",
  investments: "Investimentos",
  lateCarry: "Atrasos carregados",
};

function addMonths(monthKey: string, count: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

export default function CashflowPage() {
  const [monthRailEl, setMonthRailEl] = useState<HTMLDivElement | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia("(min-width: 640px)").matches;
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMonthKey, setDetailMonthKey] = useState<"current" | "next">("current");
  const [month, setMonth] = useState("2026-03");
  const [editMode, setEditMode] = useState<"ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT" | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingTransferGroupId, setEditingTransferGroupId] = useState<string | null>(null);
  const [editingSourceMonth, setEditingSourceMonth] = useState<string>("2026-03");
  const [editKind, setEditKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editOccurredAt, setEditOccurredAt] = useState("2026-03-01");
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
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();

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
  const monthRail = useMemo(() => {
    const offsets = isDesktop ? [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6] : [-3, -2, -1, 0, 1, 2, 3];
    return offsets.map((offset) => addMonths(month, offset));
  }, [isDesktop, month]);

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

  const freeBalance = useMemo(
    () =>
      freeBalanceController.getFreeBalance({
        householdId: householdId,
        month,
      }),
    [month, refreshKey, householdId],
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const handleChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!monthRailEl) {
      return;
    }
    const activeButton = monthRailEl.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    if (!activeButton) {
      return;
    }
    if (typeof activeButton.scrollIntoView === "function") {
      activeButton.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [month, monthRailEl]);

  useEffect(() => {
    const openLaunch = () => setTransactionModalOpen(true);
    const openImport = () => setImportModalOpen(true);
    window.addEventListener("cashflow:new-launch", openLaunch);
    window.addEventListener("cashflow:import-launch", openImport);
    return () => {
      window.removeEventListener("cashflow:new-launch", openLaunch);
      window.removeEventListener("cashflow:import-launch", openImport);
    };
  }, []);

  function handleMonthNavigation(offset: number) {
    setMonth(addMonths(month, offset));
  }

  return (
    <main className="space-y-4 pb-36 lg:pb-4">
      <section className="section-reveal flex flex-col items-start gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <button type="button" aria-label="Novo lancamento" className="sr-only" onClick={() => setTransactionModalOpen(true)}>
            Novo lancamento
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Visao operacional</p>
          <p className="text-sm text-slate-500 dark:text-slate-300">Dashboard limpo com sinal de risco e extrato do mes.</p>
        </div>
      </section>

      <Card className="section-reveal">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-3">
            <div className="space-y-2.5 lg:space-y-0">
              <div className="cashflow-month-shell">
                <div className="cashflow-month-shell__header">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Competencia</p>
                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMonthLabelBR(month)}</p>
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

                <div className="cashflow-month-rail" role="tablist" aria-label="Selecionar mes" ref={setMonthRailEl}>
                  {monthRail.map((monthItem) => {
                    const active = monthItem === month;
                    return (
                      <button
                        key={monthItem}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        className={`cashflow-month-rail__item ${active ? "is-active" : ""}`}
                        onClick={() => setMonth(monthItem)}
                      >
                        {formatMonthLabelBR(monthItem)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:inline-flex">
                <Button type="button" variant="outline" className="w-full rounded-xl sm:w-auto" onClick={() => setImportModalOpen(true)}>
                  Importar texto
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FreeBalanceSemaphore
        currentBalance={consolidatedBalance.byType.CHECKING}
        currentProjectedBalance={freeBalance.freeBalanceCurrent}
        freeBalanceNext={freeBalance.freeBalanceNext}
        gastosOperacionais={freeBalance.breakdown.current.gastosOperacionais}
        investimentos={freeBalance.breakdown.current.investimentos}
        totalSaidas={freeBalance.breakdown.current.totalSaidas}
        risk={freeBalance.risk}
        onOpenCurrentDetails={() => {
          setDetailMonthKey("current");
          setDetailModalOpen(true);
        }}
        onOpenNextDetails={() => {
          setDetailMonthKey("next");
          setDetailModalOpen(true);
        }}
      />

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

      <Sheet open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Adicionar lancamento</SheetTitle>
            <SheetDescription>Registre entrada ou saida sem sair do dashboard.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <UnifiedLaunchForm
              formId="cashflow-unified-launch-form"
              householdId={householdId}
              accounts={accounts.map((item) => ({ id: item.id, label: item.name, type: item.type }))}
              cards={cards.map((item) => ({ id: item.id, label: item.name }))}
              categories={categories.map((item) => ({ id: item.id, label: item.name }))}
              onSubmit={async (payload) => {
                await new Promise<void>((resolve, reject) => {
                  const runCreate = () => {
                    try {
                      scheduleManagementController.createLaunch(payload);
                      setRefreshKey((prev) => prev + 1);
                      setTransactionModalOpen(false);
                      notify({ message: "Lancamento cadastrado com sucesso.", tone: "success" });
                      resolve();
                    } catch (error) {
                      notify({ message: "Nao foi possivel cadastrar o lancamento.", tone: "error" });
                      reject(error);
                    }
                  };

                  window.setTimeout(runCreate, import.meta.env.MODE === "test" ? 32 : 140);
                });
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

      <Sheet open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>
              {detailMonthKey === "current" ? "Detalhamento do saldo atual - Mes atual" : "Detalhamento do saldo livre - Proximo mes"}
            </SheetTitle>
            <SheetDescription>
              {detailMonthKey === "current"
                ? "Composicao do saldo real disponivel em contas correntes no momento atual."
                : "Transparencia completa dos componentes usados no calculo da projecao."}
            </SheetDescription>
          </SheetHeader>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">
                {detailMonthKey === "current"
                  ? `Mes atual (${freeBalance.breakdown.current.month})`
                  : `Proximo mes (${freeBalance.breakdown.next.month})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {detailMonthKey === "current"
                ? consolidatedBalance.accounts.filter((account) => account.type === "CHECKING").map((account) => (
                  <div key={account.id} className="row-animate flex items-center justify-between rounded-xl px-2 py-1.5 text-sm">
                    <span className="text-slate-500 dark:text-slate-300">{account.name}</span>
                    <strong>{formatCurrencyBR(account.balance)}</strong>
                  </div>
                ))
                : Object.entries(freeBalance.breakdown.next.components).map(([label, value]) => (
                  <div key={label} className="row-animate flex items-center justify-between rounded-xl px-2 py-1.5 text-sm">
                    <span className="text-slate-500 dark:text-slate-300">{breakdownLabels[label] ?? label}</span>
                    <strong>{formatCurrencyBR(value)}</strong>
                  </div>
                ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
                <span>{detailMonthKey === "current" ? "Saldo atual em contas" : "Saldo livre final"}</span>
                <strong>
                  {formatCurrencyBR(
                    detailMonthKey === "current" ? consolidatedBalance.byType.CHECKING : freeBalance.breakdown.next.freeBalance,
                  )}
                </strong>
              </div>
              {detailMonthKey === "current" ? (
                <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 px-2 py-1.5 text-xs dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-300">Saldo previsto do mes atual</span>
                  <strong>{formatCurrencyBR(freeBalance.freeBalanceCurrent)}</strong>
                </div>
              ) : null}
            </CardContent>
          </Card>
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
