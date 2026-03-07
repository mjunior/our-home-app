import { useMemo, useState } from "react";

import { CardForm } from "../../../components/foundation/card-form";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { formatCurrencyBR, formatDateShortBR } from "../../../lib/utils";
import { cardsController, categoriesController, getRuntimeHouseholdId, invoicesController } from "../runtime";

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
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
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const cards = useMemo(() => cardsController.listCards(householdId), [refreshKey, householdId]);
  const categories = useMemo(() => categoriesController.listCategories(householdId), [refreshKey, householdId]);
  const categoryLabels = useMemo(() => Object.fromEntries(categories.map((item) => [item.id, item.name])), [categories]);
  const selectedCardId = navigationContext?.cardId ?? "";
  const selectedDueMonth = navigationContext?.dueMonth ?? "";
  const invoiceDetails = useMemo(() => {
    if (!selectedCardId || !selectedDueMonth) {
      return null;
    }

    try {
      return invoicesController.getCardInvoiceEntriesByDueMonth({
        householdId,
        cardId: selectedCardId,
        dueMonth: selectedDueMonth,
      });
    } catch {
      return null;
    }
  }, [householdId, refreshKey, selectedCardId, selectedDueMonth]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <h1>Cartoes</h1>
        <Badge variant="secondary">Foundation</Badge>
      </section>

      <CardForm
        onSubmit={(values) => {
          try {
            cardsController.createCard({ householdId, ...values });
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Cartao cadastrado com sucesso.", tone: "success" });
          } catch {
            notify({ message: "Nao foi possivel cadastrar o cartao.", tone: "error" });
          }
        }}
      />

      {navigationContext ? (
        <Card className="section-reveal">
          <CardHeader>
            <CardTitle>Contexto da fatura: {navigationContext.dueMonth}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-sm text-slate-600 dark:text-slate-300">
            {invoiceDetails ? (
              <>
                <p className="font-medium text-slate-700 dark:text-slate-200">
                  {invoiceDetails.cardName} - total {formatCurrencyBR(invoiceDetails.total)}
                </p>
                {invoiceDetails.entries.length === 0 ? (
                  <p>Nenhuma transacao encontrada para esta fatura.</p>
                ) : (
                  <ul className="space-y-2">
                    {invoiceDetails.entries.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{entry.description}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {formatDateShortBR(entry.occurredAt)} - {categoryLabels[entry.categoryId] ?? "Sem categoria"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrencyBR(entry.amount)}</p>
                            <Badge variant="outline" className="mt-1 normal-case tracking-normal">
                              {entry.sourceType === "ONE_OFF"
                                ? "Avulso"
                                : entry.sourceType === "RECURRING"
                                  ? "Recorrente"
                                  : "Parcela"}
                            </Badge>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <p>Nao foi possivel carregar os itens da fatura.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

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
                  navigationContext?.cardId === card.id
                    ? "border-brand-lime ring-1 ring-brand-lime/40"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{card.name} - fecha {card.closeDay} vence {card.dueDay}</span>
                  <button type="button" onClick={() => setEditingCardId(card.id)}>Editar</button>
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
    </main>
  );
}
