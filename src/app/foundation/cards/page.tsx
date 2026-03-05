import { useMemo, useState } from "react";

import { CardForm } from "../../../components/foundation/card-form";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { cardsController, getRuntimeHouseholdId } from "../runtime";

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
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
                {card.name} - fecha {card.closeDay} vence {card.dueDay}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
