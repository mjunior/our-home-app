import { useMemo, useState } from "react";

import { CardForm } from "../../../components/foundation/card-form";
import { cardsController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function CardsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const cards = useMemo(() => cardsController.listCards(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main className="space-y-4">
      <h1>Cartoes</h1>
      <CardForm
        onSubmit={(values) => {
          cardsController.createCard({ householdId: HOUSEHOLD_ID, ...values });
          setRefreshKey((prev) => prev + 1);
        }}
      />
      <ul className="panel">
        {cards.map((card) => (
          <li key={card.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/70">
            {card.name} - fecha {card.closeDay} vence {card.dueDay}
          </li>
        ))}
      </ul>
    </main>
  );
}
