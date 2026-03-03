import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface InstallmentListItem {
  id: string;
  description: string;
  totalAmount: string;
  installmentsCount: number;
  active: boolean;
}

interface RecurrenceListItem {
  id: string;
  description: string;
  amount: string;
  startMonth: string;
  active: boolean;
}

interface InstanceListItem {
  id: string;
  sourceType: "INSTALLMENT" | "RECURRING";
  sourceId: string;
  monthKey: string;
  description: string;
  amount: string;
  locked: boolean;
}

interface ScheduleListProps {
  installments: InstallmentListItem[];
  recurrences: RecurrenceListItem[];
  instances: InstanceListItem[];
  onEditRecurring: (payload: { ruleId: string; effectiveMonth: string; amount?: string; description?: string }) => void;
  onStopRecurring: (payload: { ruleId: string; stopFromMonth: string }) => void;
}

export function ScheduleList({ installments, recurrences, instances, onEditRecurring, onStopRecurring }: ScheduleListProps) {
  const activeRules = recurrences.filter((item) => item.active);
  const selectedRule = activeRules[0];

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>Schedules</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <section>
          <h3 className="mb-2 text-sm uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Recorrencias</h3>
          <ul className="space-y-2">
            {recurrences.map((rule) => (
              <li key={rule.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70">
                {rule.description} - R$ {rule.amount} - inicio {rule.startMonth} - {rule.active ? "ativa" : "inativa"}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-sm uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Parcelas</h3>
          <ul className="space-y-2">
            {installments.map((plan) => (
              <li key={plan.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70">
                {plan.description} - R$ {plan.totalAmount} - {plan.installmentsCount}x - {plan.active ? "ativa" : "inativa"}
              </li>
            ))}
          </ul>
        </section>

        {selectedRule ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="mb-2 text-sm font-semibold">Gerenciar recorrencia: {selectedRule.description}</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onEditRecurring({
                    ruleId: selectedRule.id,
                    amount: "150.00",
                    effectiveMonth: "2026-06",
                  })
                }
              >
                Aplicar edicao recorrencia
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onStopRecurring({
                    ruleId: selectedRule.id,
                    stopFromMonth: "2026-08",
                  })
                }
              >
                Encerrar recorrencia
              </Button>
            </div>
          </div>
        ) : null}

        <section>
          <h3 className="mb-2 text-sm uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Instancias geradas</h3>
          <ul className="space-y-2">
            {instances.map((instance) => (
              <li
                key={instance.id}
                data-testid="schedule-instance"
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70"
              >
                {instance.monthKey} - {instance.sourceType} - {instance.description} - R$ {instance.amount} - {instance.locked ? "locked" : "open"}
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
