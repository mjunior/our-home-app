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
    <section className="panel space-y-3">
      <h2>Schedules</h2>

      <h3>Recorrencias</h3>
      <ul className="space-y-2">
        {recurrences.map((rule) => (
          <li key={rule.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/70">
            {rule.description} - R$ {rule.amount} - inicio {rule.startMonth} - {rule.active ? "ativa" : "inativa"}
          </li>
        ))}
      </ul>

      <h3>Parcelas</h3>
      <ul className="space-y-2">
        {installments.map((plan) => (
          <li key={plan.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/70">
            {plan.description} - R$ {plan.totalAmount} - {plan.installmentsCount}x - {plan.active ? "ativa" : "inativa"}
          </li>
        ))}
      </ul>

      {selectedRule ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <p>Gerenciar recorrencia: {selectedRule.description}</p>
          <button
            type="button"
            onClick={() =>
              onEditRecurring({
                ruleId: selectedRule.id,
                amount: "150.00",
                effectiveMonth: "2026-06",
              })
            }
          >
            Aplicar edicao recorrencia
          </button>
          <button
            type="button"
            onClick={() =>
              onStopRecurring({
                ruleId: selectedRule.id,
                stopFromMonth: "2026-08",
              })
            }
          >
            Encerrar recorrencia
          </button>
        </div>
      ) : null}

      <h3>Instancias geradas</h3>
      <ul className="space-y-2">
        {instances.map((instance) => (
          <li key={instance.id} data-testid="schedule-instance" className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/70">
            {instance.monthKey} - {instance.sourceType} - {instance.description} - R$ {instance.amount} - {instance.locked ? "locked" : "open"}
          </li>
        ))}
      </ul>
    </section>
  );
}
