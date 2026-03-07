import { useEffect, useMemo, useState } from "react";

import { FreeBalanceSemaphore } from "../../../components/foundation/free-balance-semaphore";
import { StatementTable } from "../../../components/foundation/statement-table";
import { TransactionImportForm } from "../../../components/foundation/transaction-import-form";
import { UnifiedLaunchForm } from "../../../components/foundation/unified-launch-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { formatCurrencyBR, formatMonthLabelBR } from "../../../lib/utils";
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMonthKey, setDetailMonthKey] = useState<"current" | "next">("current");
  const [month, setMonth] = useState("2026-03");
  const [originFilter, setOriginFilter] = useState<"ALL" | "ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT" | "INVOICE">("ALL");
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"CURRENT_AND_FUTURE" | "ALL">("CURRENT_AND_FUTURE");
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();

  const accounts = useMemo(() => accountsController.listAccounts(householdId), [refreshKey, householdId]);
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
      sourceLabel: item.sourceType === "INSTALLMENT" ? ("Parcela" as const) : ("Recorrente" as const),
      sourceType: item.sourceType,
      }));

    const scheduledCardDueByCard = new Map<string, number>();
    for (const item of scheduleInstances) {
      if (item.kind !== "EXPENSE" || item.creditCardId === null || item.monthKey !== month) {
        continue;
      }
      const current = scheduledCardDueByCard.get(item.creditCardId) ?? 0;
      scheduledCardDueByCard.set(item.creditCardId, current + Number(item.amount));
    }

    const all = [...oneOff, ...invoices, ...investments, ...scheduled].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    for (const [cardId, extraTotal] of scheduledCardDueByCard.entries()) {
      const rowId = `invoice:${cardId}:${month}`;
      const existing = all.find((item) => item.id === rowId);
      if (existing) {
        existing.amount = (Number(existing.amount) + extraTotal).toFixed(2);
        continue;
      }

      const dueDay = cardDueDayMap[cardId] ?? 1;
      all.push({
        id: rowId,
        kind: "EXPENSE",
        description: `Fatura ${cardLabels[cardId] ?? "Cartao"}`,
        amount: extraTotal.toFixed(2),
        occurredAt: `${month}-${String(dueDay).padStart(2, "0")}T12:00:00.000Z`,
        categoryId: "__invoice__",
        accountId: null,
        creditCardId: cardId,
        sourceLabel: "Fatura",
        sourceType: "INVOICE",
      });
    }

    all.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    if (originFilter === "ALL") {
      return all;
    }

    if (originFilter === "ONE_OFF") {
      return all.filter((item) => item.sourceType === "ONE_OFF");
    }

    if (originFilter === "INVESTMENT") {
      return all.filter((item) => item.sourceType === "INVESTMENT");
    }

    if (originFilter === "INVOICE") {
      return all.filter((item) => item.sourceType === "INVOICE");
    }

    return all.filter((item) => item.sourceType === originFilter);
  }, [cardDueDayMap, cardLabels, dueObligations.cards, month, originFilter, scheduleInstances, transactions]);

  const freeBalance = useMemo(
    () =>
      freeBalanceController.getFreeBalance({
        householdId: householdId,
        month,
      }),
    [month, refreshKey, householdId],
  );

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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" onClick={() => setMonth((prev) => addMonths(prev, -1))}>
                Mes anterior
              </Button>
              <Badge variant="secondary">{formatMonthLabelBR(month)}</Badge>
              <Button type="button" variant="outline" onClick={() => setMonth((prev) => addMonths(prev, 1))}>
                Proximo mes
              </Button>
              <Button type="button" variant="outline" onClick={() => setImportModalOpen(true)}>
                Importar texto
              </Button>
            </div>
            <div className="grid grid-cols-[auto,1fr] items-center gap-2 lg:flex lg:items-center">
              <label htmlFor="origin-filter" className="text-sm text-slate-500 dark:text-slate-300">
                Origem
              </label>
              <select
                id="origin-filter"
                aria-label="Filtro de origem"
                className="w-full lg:w-auto"
                value={originFilter}
                onChange={(event) => setOriginFilter(event.target.value as "ALL" | "ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT" | "INVOICE")}
              >
                <option value="ALL">Todos</option>
                <option value="ONE_OFF">Avulso</option>
                <option value="INVOICE">Fatura</option>
                <option value="INVESTMENT">Investimento</option>
                <option value="RECURRING">Recorrencia</option>
                <option value="INSTALLMENT">Parcelamento</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <FreeBalanceSemaphore
        freeBalanceCurrent={freeBalance.freeBalanceCurrent}
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
        onEditEntry={(entry) => {
          if (entry.sourceType === "INVOICE") {
            notify({ message: "Edite as compras no modulo de cartoes/faturas.", tone: "info" });
            return;
          }
          const isInvestment = entry.sourceType === "INVESTMENT";
          const isOneOff = entry.sourceType === "ONE_OFF";
          setEditMode(entry.sourceType ?? "ONE_OFF");
          setEditingEntryId(isOneOff || isInvestment ? entry.id : null);
          setEditingSourceId(!isOneOff && !isInvestment ? entry.sourceId ?? null : null);
          setEditingTransferGroupId(entry.transferGroupId ?? null);
          setEditingSourceMonth(entry.monthKey ?? month);
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
          setEditModalOpen(true);
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
              onSubmit={(payload) => {
                try {
                  scheduleManagementController.createLaunch(payload);
                  setRefreshKey((prev) => prev + 1);
                  setTransactionModalOpen(false);
                  notify({ message: "Lancamento cadastrado com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel cadastrar o lancamento.", tone: "error" });
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
              cards={cards.map((item) => ({ id: item.id, label: item.name }))}
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
              Detalhamento do saldo livre - {detailMonthKey === "current" ? "Mes atual" : "Proximo mes"}
            </SheetTitle>
            <SheetDescription>Transparencia completa dos componentes usados no calculo.</SheetDescription>
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
              {Object.entries(
                detailMonthKey === "current"
                  ? freeBalance.breakdown.current.components
                  : freeBalance.breakdown.next.components,
              ).map(([label, value]) => (
                <div key={label} className="row-animate flex items-center justify-between rounded-xl px-2 py-1.5 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">{breakdownLabels[label] ?? label}</span>
                  <strong>{formatCurrencyBR(value)}</strong>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
                <span>Saldo livre final</span>
                <strong>
                  {formatCurrencyBR(
                    detailMonthKey === "current" ? freeBalance.breakdown.current.freeBalance : freeBalance.breakdown.next.freeBalance,
                  )}
                </strong>
              </div>
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
                notify({ message: "Edicao aplicada no mes atual e futuras.", tone: "success" });
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
                <label>
                  Aplicar a partir do mes
                  <input aria-label="Editar mes efetivo" value={editingSourceMonth} onChange={(event) => setEditingSourceMonth(event.target.value)} />
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
