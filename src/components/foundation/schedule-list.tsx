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
    <section>
      <h2>Schedules</h2>

      <h3>Recorrencias</h3>
      <ul>
        {recurrences.map((rule) => (
          <li key={rule.id}>
            {rule.description} - R$ {rule.amount} - inicio {rule.startMonth} - {rule.active ? "ativa" : "inativa"}
          </li>
        ))}
      </ul>

      <h3>Parcelas</h3>
      <ul>
        {installments.map((plan) => (
          <li key={plan.id}>
            {plan.description} - R$ {plan.totalAmount} - {plan.installmentsCount}x - {plan.active ? "ativa" : "inativa"}
          </li>
        ))}
      </ul>

      {selectedRule ? (
        <div>
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
      <ul>
        {instances.map((instance) => (
          <li key={instance.id} data-testid="schedule-instance">
            {instance.monthKey} - {instance.sourceType} - {instance.description} - R$ {instance.amount} - {instance.locked ? "locked" : "open"}
          </li>
        ))}
      </ul>
    </section>
  );
}
