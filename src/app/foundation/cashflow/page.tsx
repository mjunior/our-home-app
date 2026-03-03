import { useMemo, useState } from "react";

import { FreeBalanceSemaphore } from "../../../components/foundation/free-balance-semaphore";
import { StatementTable } from "../../../components/foundation/statement-table";
import { UnifiedLaunchForm } from "../../../components/foundation/unified-launch-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { formatCurrencyBR } from "../../../lib/utils";
import {
  accountsController,
  cardsController,
  categoriesController,
  freeBalanceController,
  scheduleManagementController,
  transactionsController,
} from "../runtime";

const HOUSEHOLD_ID = "household-main";

const breakdownLabels: Record<string, string> = {
  accountStartingBalance: "Saldo de contas",
  projectedIncome: "Entradas previstas",
  cardInvoiceDue: "Fatura de cartao",
  installments: "Parcelas",
  recurrences: "Recorrencias",
  oneOffExpenses: "Gastos extras",
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
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMonthKey, setDetailMonthKey] = useState<"current" | "next">("current");
  const [month, setMonth] = useState("2026-03");
  const [originFilter, setOriginFilter] = useState<"ALL" | "ONE_OFF" | "RECURRING" | "INSTALLMENT">("ALL");
  const [editMode, setEditMode] = useState<"ONE_OFF" | "RECURRING" | "INSTALLMENT" | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceMonth, setEditingSourceMonth] = useState<string>("2026-03");
  const [editKind, setEditKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editOccurredAt, setEditOccurredAt] = useState("2026-03-01");
  const [editTarget, setEditTarget] = useState<"account" | "card">("account");
  const [editTargetId, setEditTargetId] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteScope, setDeleteScope] = useState<"CURRENT_AND_FUTURE" | "ALL">("CURRENT_AND_FUTURE");
  const { notify } = useSnackbar();

  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const cards = useMemo(() => cardsController.listCards(HOUSEHOLD_ID), [refreshKey]);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  const accountLabels = useMemo(
    () => Object.fromEntries(accounts.map((item) => [item.id, item.name])),
    [accounts],
  );
  const cardLabels = useMemo(
    () => Object.fromEntries(cards.map((item) => [item.id, item.name])),
    [cards],
  );
  const categoryLabels = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const transactions = useMemo(
    () =>
      transactionsController.listTransactionsByMonth({
        householdId: HOUSEHOLD_ID,
        month,
      }),
    [refreshKey, month],
  );

  const scheduleInstances = useMemo(
    () => scheduleManagementController.listMonthInstances({ householdId: HOUSEHOLD_ID, month }),
    [refreshKey, month],
  );

  const statementEntries = useMemo(() => {
    const oneOff = transactions.map((item) => ({
      ...item,
      sourceLabel: "Avulso" as const,
      sourceType: "ONE_OFF" as const,
    }));

    const scheduled = scheduleInstances.map((item) => ({
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

    const all = [...oneOff, ...scheduled].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

    if (originFilter === "ALL") {
      return all;
    }

    if (originFilter === "ONE_OFF") {
      return all.filter((item) => item.sourceType === "ONE_OFF");
    }

    return all.filter((item) => item.sourceType === originFilter);
  }, [originFilter, scheduleInstances, transactions]);

  const freeBalance = useMemo(
    () =>
      freeBalanceController.getFreeBalance({
        householdId: HOUSEHOLD_ID,
        month,
      }),
    [month, refreshKey],
  );

  return (
    <main className="space-y-4 pb-28 lg:pb-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <div>
          <h1>Fluxo de Caixa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Dashboard limpo com sinal de risco e extrato do mes.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">Dashboard</Badge>
          <Button type="button" aria-label="Novo lancamento desktop" className="hidden lg:inline-flex" onClick={() => setTransactionModalOpen(true)}>
            Novo lancamento
          </Button>
        </div>
      </section>

      <Card className="section-reveal">
        <CardContent className="flex flex-wrap items-center gap-2 pt-5">
          <Button type="button" variant="outline" onClick={() => setMonth((prev) => addMonths(prev, -1))}>
            Mes anterior
          </Button>
          <Badge variant="secondary">{month}</Badge>
          <Button type="button" variant="outline" onClick={() => setMonth((prev) => addMonths(prev, 1))}>
            Proximo mes
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="origin-filter" className="text-sm text-slate-500 dark:text-slate-300">
              Origem
            </label>
            <select
              id="origin-filter"
              aria-label="Filtro de origem"
              value={originFilter}
              onChange={(event) => setOriginFilter(event.target.value as "ALL" | "ONE_OFF" | "RECURRING" | "INSTALLMENT")}
            >
              <option value="ALL">Todos</option>
              <option value="ONE_OFF">Avulso</option>
              <option value="RECURRING">Recorrencia</option>
              <option value="INSTALLMENT">Parcelamento</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <FreeBalanceSemaphore
        freeBalanceCurrent={freeBalance.freeBalanceCurrent}
        freeBalanceNext={freeBalance.freeBalanceNext}
        additionalCardSpendCapacity={freeBalance.additionalCardSpendCapacity}
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
        categoryLabels={categoryLabels}
        onEditEntry={(entry) => {
          const isOneOff = entry.sourceType === "ONE_OFF";
          setEditMode(entry.sourceType ?? "ONE_OFF");
          setEditingEntryId(isOneOff ? entry.id : null);
          setEditingSourceId(!isOneOff ? entry.sourceId ?? null : null);
          setEditingSourceMonth(entry.monthKey ?? month);
          setDeleteScope("CURRENT_AND_FUTURE");
          setEditKind(entry.kind);
          setEditDescription(entry.description);
          setEditAmount(entry.amount);
          setEditOccurredAt(entry.occurredAt.slice(0, 10));
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

      <div className="fixed inset-x-0 bottom-[4.7rem] z-30 px-3 pb-2 lg:hidden">
        <Sheet open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="lime" className="h-12 w-full text-sm">
              Novo lancamento
            </Button>
          </SheetTrigger>
          <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
            <SheetHeader>
              <SheetTitle>Adicionar lancamento</SheetTitle>
              <SheetDescription>Registre entrada ou saida sem sair do dashboard.</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <UnifiedLaunchForm
                formId="cashflow-unified-launch-form"
                householdId={HOUSEHOLD_ID}
                accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
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
      </div>

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
                    householdId: HOUSEHOLD_ID,
                    kind: editKind,
                    description: editDescription,
                    amount: editAmount,
                    occurredAt: `${editOccurredAt}T12:00:00.000Z`,
                    categoryId: editCategoryId || categories[0]?.id || "",
                    accountId: editTarget === "account" ? editTargetId : undefined,
                    creditCardId: editTarget === "card" ? editTargetId : undefined,
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
            {editMode === "ONE_OFF" ? (
              <div className="grid grid-cols-2 gap-3">
                <label>
                  Tipo da transacao
                  <select aria-label="Editar tipo da transacao" value={editKind} onChange={(event) => setEditKind(event.target.value as "INCOME" | "EXPENSE")}>
                    <option value="INCOME">Entrada</option>
                    <option value="EXPENSE">Saida</option>
                  </select>
                </label>
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

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {editMode === "ONE_OFF"
                ? "Esta edicao altera apenas o lancamento selecionado."
                : "Esta edicao altera o mes atual selecionado e todas as ocorrencias futuras."}
            </p>

            {editMode !== "ONE_OFF" ? (
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
                      if (!editingEntryId) {
                        throw new Error("TRANSACTION_NOT_SELECTED");
                      }
                      transactionsController.deleteTransaction({ id: editingEntryId, householdId: HOUSEHOLD_ID });
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
