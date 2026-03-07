import { useEffect, useMemo, useState } from "react";

import { CardForm } from "../../../components/foundation/card-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { formatCurrencyBR, formatDateShortBR, formatMonthLabelBR } from "../../../lib/utils";
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

type EditMode = "ONE_OFF" | "RECURRING" | "INSTALLMENT" | null;

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createCardModalOpen, setCreateCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
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

  const [selectedDueMonth, setSelectedDueMonth] = useState(() => navigationContext?.dueMonth ?? "2026-03");
  const [selectedInvoiceCardId, setSelectedInvoiceCardId] = useState(() => navigationContext?.cardId ?? "");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingSourceMonth, setEditingSourceMonth] = useState("2026-03");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editOccurredAt, setEditOccurredAt] = useState("2026-03-01");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [deleteScope, setDeleteScope] = useState<"CURRENT_AND_FUTURE" | "ALL">("CURRENT_AND_FUTURE");

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
      setSelectedInvoiceCardId(monthlyInvoices.cards[0]!.cardId);
    }
  }, [monthlyInvoices.cards, selectedInvoiceCardId]);

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
                          <div className="mt-2">
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
                              <div className="flex flex-wrap items-center gap-2">
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
                                    }
                                  }}
                                >
                                  Marcar paga
                                </Button>
                              </div>
                            )}
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
                  {selectedInvoiceSummary ? <Badge variant="outline">{formatCurrencyBR(selectedInvoiceSummary.total)}</Badge> : null}
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
                ) : invoiceDetails.entries.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                    Esta fatura nao possui transacoes no periodo.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200/70 bg-slate-100/70 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                          <th className="px-3 py-2 text-left">Data</th>
                          <th className="px-3 py-2 text-left">Descricao</th>
                          <th className="px-3 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetails.entries.map((entry, index) => {
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
                                setEditDescription(entry.description);
                                setEditAmount(entry.amount);
                                setEditOccurredAt(entry.occurredAt.slice(0, 10));
                                setEditCategoryId(entry.categoryId);
                                setDeleteScope("CURRENT_AND_FUTURE");
                                setEditModalOpen(true);
                              }}
                            >
                              <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{formatDateShortBR(entry.occurredAt)}</td>
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
                  <button type="button" onClick={() => setEditingCardId(card.id)}>
                    Editar
                  </button>
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
                notify({ message: "Edicao aplicada com sucesso.", tone: "success" });
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
              <label>
                Aplicar a partir do mes
                <input aria-label="Editar mes efetivo" value={editingSourceMonth} onChange={(event) => setEditingSourceMonth(event.target.value)} />
              </label>
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
    </main>
  );
}
