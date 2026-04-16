import { Fragment, useEffect, useMemo, useRef, useState } from "react";

import { CardForm } from "../../../components/foundation/card-form";
import { TransactionForm } from "../../../components/foundation/transaction-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { sumMoney } from "../../../domain/shared/money";
import { launchConfettiCanvas, playCheerSound } from "../../../lib/celebration";
import {
  currencyInputToDecimal,
  formatCurrencyBR,
  formatCurrencyInputBRL,
  formatDateShortBR,
  formatMonthLabelBR,
  getCurrentMonthKeyLocal,
} from "../../../lib/utils";
import type { RecurringEditScope } from "../../../modules/scheduling/schedule-management.service";
import {
  accountsController,
  cardsController,
  categoriesController,
  getRuntimeHouseholdId,
  invoicesController,
  scheduleManagementController,
  transactionsController,
} from "../runtime";

function addMonths(monthKey: string, count: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + count, 1));
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`;
}

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear().toString().padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDefaultExpenseDateForInvoice(dueMonth: string, closeDay: number) {
  const today = getTodayDateInputValue();
  const [todayYear, todayMonth] = today.split("-").map(Number);
  const todayUtc = new Date(Date.UTC(todayYear, todayMonth - 1, Number(today.slice(8, 10))));
  const todayMonthKey = today.slice(0, 7);
  const todayCycleMonth = todayUtc.getUTCDate() >= closeDay ? addMonths(todayMonthKey, 1) : todayMonthKey;
  if (todayCycleMonth === dueMonth) {
    return today;
  }

  if (closeDay === 1) {
    const previousMonth = addMonths(dueMonth, -1);
    return `${previousMonth}-01`;
  }

  return `${dueMonth}-${String(closeDay - 1).padStart(2, "0")}`;
}

type EditMode = "ONE_OFF" | "RECURRING" | "INSTALLMENT" | null;
type InvoiceEntrySourceType = Exclude<EditMode, null>;
type InvoiceEntryDisplayGroup = "OPEN_INSTALLMENT" | "LATEST" | "RECURRING";
type InvoiceAdjustmentTarget = {
  cardId: string;
  cardName: string;
  total: string;
  dueMonth: string;
};

const invoiceEntryGroups: Array<{ key: InvoiceEntryDisplayGroup; label: string }> = [
  { key: "OPEN_INSTALLMENT", label: "Parcelamentos" },
  { key: "LATEST", label: "Ultimos lancamentos" },
  { key: "RECURRING", label: "Recorrencias" },
];

const invoiceEntryGroupOrder: Record<InvoiceEntryDisplayGroup, number> = {
  OPEN_INSTALLMENT: 0,
  LATEST: 1,
  RECURRING: 2,
};

function resolveRegisteredAt(entry: { registeredAt?: string; occurredAt: string }) {
  return entry.registeredAt ?? entry.occurredAt;
}

function compareInvoiceEntries(
  a: { sourceType: InvoiceEntrySourceType; installmentSequence?: number | null; registeredAt?: string; occurredAt: string; description: string },
  b: { sourceType: InvoiceEntrySourceType; installmentSequence?: number | null; registeredAt?: string; occurredAt: string; description: string },
) {
  const groupDiff = invoiceEntryGroupOrder[resolveInvoiceEntryDisplayGroup(a)] - invoiceEntryGroupOrder[resolveInvoiceEntryDisplayGroup(b)];
  if (groupDiff !== 0) {
    return groupDiff;
  }

  const registeredDiff = resolveRegisteredAt(b).localeCompare(resolveRegisteredAt(a));
  if (registeredDiff !== 0) {
    return registeredDiff;
  }

  const occurredDiff = b.occurredAt.localeCompare(a.occurredAt);
  if (occurredDiff !== 0) {
    return occurredDiff;
  }

  return a.description.localeCompare(b.description, "pt-BR");
}

function resolveInvoiceEntryDisplayGroup(entry: { sourceType: InvoiceEntrySourceType; installmentSequence?: number | null }): InvoiceEntryDisplayGroup {
  if (entry.sourceType === "INSTALLMENT" && entry.installmentSequence !== 1) {
    return "OPEN_INSTALLMENT";
  }

  if (entry.sourceType === "RECURRING") {
    return "RECURRING";
  }

  return "LATEST";
}

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createCardModalOpen, setCreateCardModalOpen] = useState(false);
  const [deleteCardModalOpen, setDeleteCardModalOpen] = useState(false);
  const [pendingDeleteCardId, setPendingDeleteCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [quickExpenseModalOpen, setQuickExpenseModalOpen] = useState(false);
  const [quickExpenseResetKey, setQuickExpenseResetKey] = useState(0);
  const [adjustmentSheetOpen, setAdjustmentSheetOpen] = useState(false);
  const [adjustmentTarget, setAdjustmentTarget] = useState<InvoiceAdjustmentTarget | null>(null);
  const [adjustmentRealTotal, setAdjustmentRealTotal] = useState("");
  const [adjustmentDueMonth, setAdjustmentDueMonth] = useState(() => getCurrentMonthKeyLocal());
  const [adjustmentOccurredAt, setAdjustmentOccurredAt] = useState(getTodayDateInputValue());
  const [navigationContext] = useState<{ cardId: string; dueMonth: string } | null>(() => {
    const raw = sessionStorage.getItem("cards:navigation-context");
    if (!raw) {
      return null;
    }

    sessionStorage.removeItem("cards:navigation-context");
    try {
      const parsed = JSON.parse(raw) as { cardId?: string; dueMonth?: string };
      if (!parsed.cardId || !parsed.dueMonth) {
        return null;
      }
      return { cardId: parsed.cardId, dueMonth: parsed.dueMonth };
    } catch {
      return null;
    }
  });

  const [selectedDueMonth, setSelectedDueMonth] = useState(() => navigationContext?.dueMonth ?? getCurrentMonthKeyLocal());
  const [selectedInvoiceCardId, setSelectedInvoiceCardId] = useState(() => navigationContext?.cardId ?? "");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceMonth, setEditingSourceMonth] = useState(() => getCurrentMonthKeyLocal());
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editOccurredAt, setEditOccurredAt] = useState(() => `${getCurrentMonthKeyLocal()}-01`);
  const [editCategoryId, setEditCategoryId] = useState("");
  const [deleteScope, setDeleteScope] = useState<"CURRENT_AND_FUTURE" | "ALL">("CURRENT_AND_FUTURE");
  const [editRecurringScope, setEditRecurringScope] = useState<RecurringEditScope>("THIS_ONLY");
  const settleDebounceTimers = useRef<Record<string, number>>({});

  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const accounts = useMemo(() => accountsController.listAccounts(householdId), [refreshKey, householdId]);
  const checkingAccounts = useMemo(() => accounts.filter((item) => item.type === "CHECKING"), [accounts]);
  const cards = useMemo(() => cardsController.listCards(householdId), [refreshKey, householdId]);
  const categories = useMemo(() => categoriesController.listCategories(householdId), [refreshKey, householdId]);
  const categoryLabels = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, item.name])), [categories]);
  const monthlyInvoices = useMemo(
    () => invoicesController.getMonthlyInvoices({ householdId, month: selectedDueMonth }),
    [householdId, refreshKey, selectedDueMonth],
  );

  useEffect(() => {
    if (!monthlyInvoices.cards.length) {
      setSelectedInvoiceCardId("");
      return;
    }

    if (!selectedInvoiceCardId || !monthlyInvoices.cards.some((item) => item.cardId === selectedInvoiceCardId)) {
      setSelectedInvoiceCardId((monthlyInvoices.cards.find((item) => !item.paid) ?? monthlyInvoices.cards[0]!).cardId);
    }
  }, [monthlyInvoices.cards, selectedInvoiceCardId]);

  useEffect(() => {
    return () => {
      for (const timer of Object.values(settleDebounceTimers.current)) {
        window.clearTimeout(timer);
      }
      settleDebounceTimers.current = {};
    };
  }, []);

  const invoiceDetails = useMemo(() => {
    if (!selectedInvoiceCardId) {
      return null;
    }

    try {
      return invoicesController.getCardInvoiceEntriesByDueMonth({
        householdId,
        cardId: selectedInvoiceCardId,
        dueMonth: selectedDueMonth,
      });
    } catch {
      return null;
    }
  }, [householdId, refreshKey, selectedDueMonth, selectedInvoiceCardId]);

  const selectedInvoiceSummary = monthlyInvoices.cards.find((item) => item.cardId === selectedInvoiceCardId) ?? null;
  const selectedCard = cards.find((item) => item.id === selectedInvoiceCardId) ?? null;
  const pendingDeleteCard = cards.find((item) => item.id === pendingDeleteCardId) ?? null;
  const sortedInvoiceEntries = useMemo(
    () => [...(invoiceDetails?.entries ?? [])].sort(compareInvoiceEntries),
    [invoiceDetails?.entries],
  );
  const groupedInvoiceEntries = useMemo(
    () =>
      invoiceEntryGroups
        .map((group) => {
          const entries = sortedInvoiceEntries.filter((entry) => resolveInvoiceEntryDisplayGroup(entry) === group.key);
          return {
            ...group,
            entries,
            total: sumMoney(entries.map((entry) => entry.amount)),
          };
        })
        .filter((group) => group.entries.length > 0),
    [sortedInvoiceEntries],
  );
  const quickExpenseInitialValues = useMemo(
    () =>
      selectedInvoiceSummary && selectedCard
        ? {
            kind: "EXPENSE" as const,
            target: "card" as const,
            targetId: selectedInvoiceSummary.cardId,
            occurredAt: resolveDefaultExpenseDateForInvoice(selectedDueMonth, selectedCard.closeDay),
            categoryId: categories[0]?.id ?? "",
          }
        : undefined,
    [categories, selectedCard, selectedDueMonth, selectedInvoiceSummary],
  );

  function openInvoiceAdjustment(invoice: { cardId: string; cardName: string; total: string }) {
    setSelectedInvoiceCardId(invoice.cardId);
    setAdjustmentTarget({
      cardId: invoice.cardId,
      cardName: invoice.cardName,
      total: invoice.total,
      dueMonth: selectedDueMonth,
    });
    setAdjustmentRealTotal(formatCurrencyInputBRL(invoice.total));
    setAdjustmentDueMonth(selectedDueMonth);
    setAdjustmentOccurredAt(getTodayDateInputValue());
    setAdjustmentSheetOpen(true);
  }

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-300">Faturas mensais com detalhe operacional das despesas.</p>
        <Button type="button" onClick={() => setCreateCardModalOpen(true)}>
          Novo cartao
        </Button>
      </section>

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Faturas do mes {selectedDueMonth}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setSelectedDueMonth((prev) => addMonths(prev, -1))}>
              Mes anterior
            </Button>
            <Badge variant="secondary">{formatMonthLabelBR(selectedDueMonth)}</Badge>
            <Button type="button" variant="outline" onClick={() => setSelectedDueMonth((prev) => addMonths(prev, 1))}>
              Proximo mes
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Lista de faturas</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyInvoices.cards.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Nenhuma fatura encontrada para o mes selecionado.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {monthlyInvoices.cards.map((invoice) => (
                      <li key={`${invoice.cardId}:${selectedDueMonth}`}>
                        <div
                          role="button"
                          tabIndex={0}
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            selectedInvoiceCardId === invoice.cardId
                              ? "border-brand-lime bg-brand-lime/10 ring-1 ring-brand-lime/40"
                              : "border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/70 dark:hover:border-slate-700"
                          }`}
                          onClick={() => setSelectedInvoiceCardId(invoice.cardId)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedInvoiceCardId(invoice.cardId);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">Fatura {invoice.cardName}</span>
                            <strong>{formatCurrencyBR(invoice.total)}</strong>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>Vencimento: dia {invoice.dueDay}</span>
                            {invoice.paid ? (
                              <span className="rounded-full border border-brand-lime/40 bg-brand-lime/20 px-2 py-0.5 text-brand-lime">
                                Paga {invoice.paidAt ? formatDateShortBR(invoice.paidAt) : ""}
                              </span>
                            ) : (
                              <span className="rounded-full border border-slate-300 px-2 py-0.5 dark:border-slate-700">Nao paga</span>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {invoice.paid ? (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  try {
                                    invoicesController.unsettleInvoice({
                                      householdId,
                                      cardId: invoice.cardId,
                                      dueMonth: selectedDueMonth,
                                    });
                                    setRefreshKey((prev) => prev + 1);
                                    notify({ message: "Pagamento da fatura desfeito.", tone: "info" });
                                  } catch {
                                    notify({ message: "Nao foi possivel desfazer pagamento.", tone: "error" });
                                  }
                                }}
                              >
                                Desfazer pagamento
                              </Button>
                            ) : (
                              <>
                                <select
                                  aria-label={`Conta pagamento ${invoice.cardName}`}
                                  defaultValue={checkingAccounts[0]?.id ?? ""}
                                  onClick={(event) => event.stopPropagation()}
                                  className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-900"
                                  id={`invoice-account-${invoice.cardId}`}
                                >
                                  {checkingAccounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                      {account.name}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    const field = document.getElementById(`invoice-account-${invoice.cardId}`) as HTMLSelectElement | null;
                                    const paymentAccountId = field?.value ?? checkingAccounts[0]?.id;
                                    if (!paymentAccountId) {
                                      notify({ message: "Selecione uma conta para pagar a fatura.", tone: "error" });
                                      return;
                                    }
                                    playCheerSound();
                                    launchConfettiCanvas();

                                    const settleKey = `${invoice.cardId}:${selectedDueMonth}`;
                                    const activeTimer = settleDebounceTimers.current[settleKey];
                                    if (activeTimer) {
                                      window.clearTimeout(activeTimer);
                                    }
                                    settleDebounceTimers.current[settleKey] = window.setTimeout(() => {
                                      try {
                                        invoicesController.settleInvoice({
                                          householdId,
                                          cardId: invoice.cardId,
                                          dueMonth: selectedDueMonth,
                                          paymentAccountId,
                                          paidAt: new Date().toISOString(),
                                          paidAmount: invoice.total,
                                        });
                                        setRefreshKey((prev) => prev + 1);
                                        notify({ message: "Fatura marcada como paga.", tone: "success" });
                                      } catch {
                                        notify({ message: "Nao foi possivel pagar a fatura.", tone: "error" });
                                      } finally {
                                        delete settleDebounceTimers.current[settleKey];
                                      }
                                    }, 260);
                                  }}
                                >
                                  Marcar paga
                                </Button>
                              </>
                            )}
                            <Button
                              type="button"
                              variant="outline"
                              onClick={(event) => {
                                event.stopPropagation();
                                openInvoiceAdjustment(invoice);
                              }}
                              aria-label={`Reajustar fatura ${invoice.cardName}`}
                            >
                              Reajustar
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 dark:border-slate-700/70">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    {selectedInvoiceSummary
                      ? `Detalhe da fatura: ${selectedInvoiceSummary.cardName}`
                      : "Detalhe da fatura"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedInvoiceSummary ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuickExpenseResetKey((prev) => prev + 1);
                          setQuickExpenseModalOpen(true);
                        }}
                      >
                        Adicionar despesa
                      </Button>
                    ) : null}
                    {selectedInvoiceSummary ? <Badge variant="outline">{formatCurrencyBR(selectedInvoiceSummary.total)}</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-slate-600 dark:text-slate-300">
                {!selectedInvoiceCardId ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Selecione uma fatura na lista para visualizar os itens.
                  </div>
                ) : !invoiceDetails ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    Nao foi possivel carregar os itens desta fatura. Tente atualizar a pagina.
                  </div>
                ) : sortedInvoiceEntries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Esta fatura nao possui transacoes no periodo.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200/70 bg-slate-100/70 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                          <th className="px-3 py-2 text-left">Lancado em</th>
                          <th className="px-3 py-2 text-left">Registrado em</th>
                          <th className="px-3 py-2 text-left">Descricao</th>
                          <th className="px-3 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedInvoiceEntries.map((group) => (
                          <Fragment key={group.key}>
                            <tr className="border-b border-slate-200/70 bg-slate-50 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-300">
                              <td colSpan={4} className="px-3 py-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-semibold">{group.label}</span>
                                  <span>
                                    {group.entries.length} {group.entries.length === 1 ? "item" : "itens"} - {formatCurrencyBR(group.total)}
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {group.entries.map((entry, index) => {
                              const installmentMatch = entry.description.match(/\((\d+\/\d+)\)\s*$/);
                              const installmentLabel = entry.sourceType === "INSTALLMENT" ? installmentMatch?.[1] ?? "" : "";
                              const baseDescription = installmentMatch
                                ? entry.description.replace(/\s*\(\d+\/\d+\)\s*$/, "")
                                : entry.description;
                              const recurringMark = entry.sourceType === "RECURRING" ? "↻ " : "";

                              return (
                                <tr
                                  key={entry.id}
                                  className={`cursor-pointer border-b border-slate-200/70 text-slate-700 transition hover:bg-slate-100/70 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900/70 ${
                                    index % 2 === 0 ? "bg-transparent" : "bg-slate-50/60 dark:bg-slate-950/40"
                                  }`}
                                  onClick={() => {
                                    setEditMode(entry.sourceType);
                                    setEditingEntryId(entry.sourceType === "ONE_OFF" ? entry.id : null);
                                    setEditingSourceId(entry.sourceType !== "ONE_OFF" ? entry.sourceId : null);
                                    setEditingSourceMonth(entry.monthKey ?? selectedDueMonth);
                                    setEditRecurringScope("THIS_ONLY");
                                    setEditDescription(entry.description);
                                    setEditAmount(entry.amount);
                                    setEditOccurredAt(entry.occurredAt.slice(0, 10));
                                    setEditCategoryId(entry.categoryId);
                                    setDeleteScope("CURRENT_AND_FUTURE");
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="block text-[10px] uppercase text-slate-400 sm:hidden">Lancado</span>
                                    {formatDateShortBR(entry.occurredAt)}
                                  </td>
                                  <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="block text-[10px] uppercase text-slate-400 sm:hidden">Registrado</span>
                                    {formatDateShortBR(resolveRegisteredAt(entry))}
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="font-medium">
                                      {recurringMark}
                                      {baseDescription}
                                      {installmentLabel ? ` ${installmentLabel}` : ""}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold">{formatCurrencyBR(entry.amount)}</td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Cartoes cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className={`rounded-xl border bg-slate-50 p-3 text-sm dark:bg-slate-950/70 ${
                  selectedInvoiceCardId === card.id ? "border-brand-lime ring-1 ring-brand-lime/40" : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {card.name} - fecha {card.closeDay} vence {card.dueDay}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setEditingCardId(card.id)}>
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setPendingDeleteCardId(card.id);
                        setDeleteCardModalOpen(true);
                      }}
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
                {editingCardId === card.id ? (
                  <CardForm
                    initialValues={{ name: card.name, closeDay: card.closeDay, dueDay: card.dueDay }}
                    submitLabel="Salvar cartao"
                    onCancel={() => setEditingCardId(null)}
                    onSubmit={(values) => {
                      try {
                        cardsController.updateCard({ id: card.id, householdId, ...values });
                        setRefreshKey((prev) => prev + 1);
                        setEditingCardId(null);
                        notify({ message: "Cartao atualizado com sucesso.", tone: "success" });
                      } catch {
                        notify({ message: "Nao foi possivel atualizar o cartao.", tone: "error" });
                      }
                    }}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Sheet open={quickExpenseModalOpen} onOpenChange={setQuickExpenseModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Adicionar despesa no cartao</SheetTitle>
            <SheetDescription>
              {selectedInvoiceSummary
                ? `${selectedInvoiceSummary.cardName} - ${formatMonthLabelBR(selectedDueMonth)}`
                : "Selecione uma fatura para lancar uma nova despesa."}
            </SheetDescription>
          </SheetHeader>
          {selectedInvoiceSummary ? (
            <div className="mt-4">
              <TransactionForm
                formId="cards-quick-expense-form"
                title="Nova despesa"
                submitLabel="Adicionar despesa"
                resetKey={quickExpenseResetKey}
                lockKind
                lockTarget
                initialValues={quickExpenseInitialValues}
                accounts={checkingAccounts.map((item) => ({ id: item.id, label: item.name }))}
                cards={cards.map((item) => ({ id: item.id, label: item.name }))}
                categories={categories.map((item) => ({ id: item.id, label: item.name }))}
                onSubmit={(values) => {
                  try {
                    transactionsController.createTransaction({
                      householdId,
                      kind: "EXPENSE",
                      description: values.description,
                      amount: values.amount,
                      occurredAt: values.occurredAt,
                      creditCardId: selectedInvoiceSummary.cardId,
                      categoryId: values.categoryId,
                    });
                    setRefreshKey((prev) => prev + 1);
                    setQuickExpenseModalOpen(false);
                    notify({ message: "Despesa adicionada ao cartao.", tone: "success" });
                  } catch {
                    notify({ message: "Nao foi possivel adicionar a despesa.", tone: "error" });
                  }
                }}
              />
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={adjustmentSheetOpen}
        onOpenChange={(open) => {
          setAdjustmentSheetOpen(open);
          if (!open) {
            setAdjustmentTarget(null);
          }
        }}
      >
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Reajustar fatura</SheetTitle>
            <SheetDescription>
              {adjustmentTarget
                ? `${adjustmentTarget.cardName} - ${formatMonthLabelBR(adjustmentDueMonth)}`
                : "Selecione uma fatura para lancar um reajuste."}
            </SheetDescription>
          </SheetHeader>

          {adjustmentTarget ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  invoicesController.createCreditCardAdjustment({
                    householdId,
                    cardId: adjustmentTarget.cardId,
                    realInvoiceTotal: currencyInputToDecimal(adjustmentRealTotal),
                    dueMonth: adjustmentDueMonth,
                    occurredAt: `${adjustmentOccurredAt}T12:00:00.000Z`,
                  });
                  setRefreshKey((prev) => prev + 1);
                  setAdjustmentSheetOpen(false);
                  setAdjustmentTarget(null);
                  notify({ message: "Reajuste de fatura lancado com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel lancar o reajuste da fatura.", tone: "error" });
                }
              }}
            >
              <p className="rounded-xl bg-slate-100/80 p-3 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                Total atual no app: <strong>{formatCurrencyBR(adjustmentTarget.total)}</strong>
              </p>

              <label>
                Valor real da fatura
                <input
                  aria-label="Valor real da fatura"
                  value={adjustmentRealTotal}
                  onChange={(event) => setAdjustmentRealTotal(formatCurrencyInputBRL(event.target.value))}
                />
              </label>

              <label>
                Mes da fatura
                <input
                  aria-label="Mes da fatura"
                  value={adjustmentDueMonth}
                  onChange={(event) => setAdjustmentDueMonth(event.target.value)}
                />
              </label>

              <label>
                Data do reajuste
                <input
                  aria-label="Data do reajuste"
                  type="date"
                  value={adjustmentOccurredAt}
                  onChange={(event) => setAdjustmentOccurredAt(event.target.value)}
                />
              </label>

              <Button type="submit">Salvar reajuste</Button>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={editModalOpen} onOpenChange={setEditModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Editar item da fatura</SheetTitle>
            <SheetDescription>
              {selectedInvoiceSummary
                ? `${selectedInvoiceSummary.cardName} - ${formatMonthLabelBR(selectedDueMonth)}`
                : "Atualize os dados e salve para recalcular os totais."}
            </SheetDescription>
          </SheetHeader>

          <form
            className="mt-4 grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              try {
                if (editMode === "ONE_OFF") {
                  if (!editingEntryId || !selectedInvoiceCardId) {
                    throw new Error("TRANSACTION_NOT_SELECTED");
                  }
                  transactionsController.updateTransaction({
                    id: editingEntryId,
                    householdId,
                    kind: "EXPENSE",
                    description: editDescription,
                    amount: editAmount,
                    occurredAt: `${editOccurredAt}T12:00:00.000Z`,
                    categoryId: editCategoryId || categories[0]?.id || "",
                    creditCardId: selectedInvoiceCardId,
                  });
                } else if (editMode === "RECURRING") {
                  if (!editingSourceId) {
                    throw new Error("RECURRING_NOT_SELECTED");
                  }
                  scheduleManagementController.editRecurringSchedule({
                    ruleId: editingSourceId,
                    effectiveMonth: editingSourceMonth,
                    scope: editRecurringScope,
                    kind: "EXPENSE",
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
                    kind: "EXPENSE",
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
                      : "Edicao aplicada com sucesso.",
                  tone: "success",
                });
              } catch {
                notify({ message: "Nao foi possivel editar o item da fatura.", tone: "error" });
              }
            }}
          >
            {editMode === "ONE_OFF" ? (
              <label>
                Data da transacao
                <input aria-label="Editar data da transacao" type="date" value={editOccurredAt} onChange={(event) => setEditOccurredAt(event.target.value)} />
              </label>
            ) : (
              <>
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
              </>
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
            ) : (
              <label>
                Escopo de exclusao
                <select
                  aria-label="Escopo de exclusao"
                  value={deleteScope}
                  onChange={(event) => setDeleteScope(event.target.value as "CURRENT_AND_FUTURE" | "ALL")}
                >
                  <option value="CURRENT_AND_FUTURE">Excluir atual + futuras</option>
                  <option value="ALL">Excluir todas (inclui antigas)</option>
                </select>
              </label>
            )}

            <p className="rounded-xl bg-slate-100/80 p-2 text-xs text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
              {editMode === "ONE_OFF"
                ? "Esta edicao altera apenas o item selecionado."
                : editMode === "RECURRING" && editRecurringScope === "THIS_ONLY"
                  ? "Esta edicao altera apenas esta ocorrencia da recorrencia."
                : "Esta edicao altera o mes selecionado e todas as ocorrencias futuras."}
            </p>

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
                      transactionsController.deleteTransaction({ id: editingEntryId, householdId });
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
                    notify({ message: "Item excluido com sucesso.", tone: "info" });
                  } catch {
                    notify({ message: "Nao foi possivel excluir o item da fatura.", tone: "error" });
                  }
                }}
              >
                Excluir
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={createCardModalOpen} onOpenChange={setCreateCardModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Novo cartao</SheetTitle>
            <SheetDescription>Cadastre um cartao com fechamento e vencimento.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <CardForm
              onSubmit={(values) => {
                try {
                  cardsController.createCard({ householdId, ...values });
                  setRefreshKey((prev) => prev + 1);
                  setCreateCardModalOpen(false);
                  notify({ message: "Cartao cadastrado com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel cadastrar o cartao.", tone: "error" });
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={deleteCardModalOpen}
        onOpenChange={(open) => {
          setDeleteCardModalOpen(open);
          if (!open) {
            setPendingDeleteCardId(null);
          }
        }}
      >
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto w-[94%] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Excluir cartao</SheetTitle>
            <SheetDescription>
              {pendingDeleteCard
                ? `Voce esta prestes a excluir ${pendingDeleteCard.name}.`
                : "Voce esta prestes a excluir um cartao."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              Esta acao remove o cartao e todos os dados relacionados: faturas, transacoes, recorrencias, parcelamentos e instancias.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="outline" onClick={() => setDeleteCardModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (!pendingDeleteCardId) {
                    return;
                  }
                  try {
                    cardsController.deleteCard({ id: pendingDeleteCardId, householdId });
                    if (selectedInvoiceCardId === pendingDeleteCardId) {
                      setSelectedInvoiceCardId("");
                    }
                    setEditingCardId((current) => (current === pendingDeleteCardId ? null : current));
                    setDeleteCardModalOpen(false);
                    setPendingDeleteCardId(null);
                    setRefreshKey((prev) => prev + 1);
                    notify({ message: "Cartao e dados relacionados excluidos.", tone: "success" });
                  } catch {
                    notify({ message: "Nao foi possivel excluir o cartao.", tone: "error" });
                  }
                }}
              >
                Confirmar exclusao
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
