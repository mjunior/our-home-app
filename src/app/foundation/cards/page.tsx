import { useMemo, useState } from "react";

import { CardForm } from "../../../components/foundation/card-form";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { cardsController, getRuntimeHouseholdId } from "../runtime";

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const cards = useMemo(() => cardsController.listCards(householdId), [refreshKey, householdId]);

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

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Cartoes cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70">
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
