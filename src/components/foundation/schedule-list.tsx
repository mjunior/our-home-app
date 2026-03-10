import { useEffect, useState } from "react";

import type { RecurringEditScope } from "../../modules/scheduling/schedule-management.service";
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
  onEditRecurring: (payload: { ruleId: string; effectiveMonth: string; scope: RecurringEditScope; amount?: string; description?: string }) => void;
  onStopRecurring: (payload: { ruleId: string; stopFromMonth: string }) => void;
  onDeleteRecurring: (payload: { ruleId: string; fromMonth: string; scope: "CURRENT_AND_FUTURE" | "ALL" }) => void;
}

export function ScheduleList({ installments, recurrences, instances, onEditRecurring, onStopRecurring, onDeleteRecurring }: ScheduleListProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string>(recurrences[0]?.id ?? "");
  const [editDescription, setEditDescription] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("2026-03");
  const [editScope, setEditScope] = useState<RecurringEditScope>("THIS_ONLY");
  const [stopFromMonth, setStopFromMonth] = useState("2026-03");
  const selectedRule = recurrences.find((item) => item.id === selectedRuleId) ?? recurrences[0];

  useEffect(() => {
    if (!selectedRule) return;
    setSelectedRuleId(selectedRule.id);
    setEditDescription(selectedRule.description);
    setEditAmount(selectedRule.amount);
    setEffectiveMonth(selectedRule.startMonth);
    setEditScope("THIS_ONLY");
    setStopFromMonth(selectedRule.startMonth);
  }, [selectedRule?.id]);

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
              <label>
                Regra ativa
                <select value={selectedRuleId} onChange={(event) => setSelectedRuleId(event.target.value)}>
                  {recurrences.map((rule) => (
                    <option key={rule.id} value={rule.id}>
                      {rule.description}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Escopo da edicao
                <select value={editScope} onChange={(event) => setEditScope(event.target.value as RecurringEditScope)}>
                  <option value="THIS_ONLY">Editar somente este mes</option>
                  <option value="CURRENT_AND_FUTURE">Editar este mes e futuras</option>
                </select>
              </label>
              <label>
                {editScope === "THIS_ONLY" ? "Mes da ocorrencia" : "Mes efetivo da edicao"}
                <input value={effectiveMonth} onChange={(event) => setEffectiveMonth(event.target.value)} readOnly={editScope === "THIS_ONLY"} />
              </label>
              <label>
                Nova descricao
                <input value={editDescription} onChange={(event) => setEditDescription(event.target.value)} />
              </label>
              <label>
                Novo valor
                <input value={editAmount} onChange={(event) => setEditAmount(event.target.value)} />
              </label>
              <label>
                Encerrar a partir de
                <input value={stopFromMonth} onChange={(event) => setStopFromMonth(event.target.value)} />
              </label>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onEditRecurring({
                    ruleId: selectedRule.id,
                    description: editDescription,
                    amount: editAmount,
                    effectiveMonth,
                    scope: editScope,
                  })
                }
              >
                Salvar edicao da recorrencia
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  onStopRecurring({
                    ruleId: selectedRule.id,
                    stopFromMonth,
                  })
                }
              >
                Encerrar recorrencia
              </Button>
            </div>
            <div className="mt-2">
              <p className="mb-2 rounded-xl bg-slate-100/80 p-2 text-xs text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
                {editScope === "THIS_ONLY"
                  ? "Esta edicao altera apenas a ocorrencia do mes selecionado."
                  : "Esta edicao altera o mes selecionado e todas as ocorrencias futuras."}
              </p>
              <Button
                type="button"
                variant="danger"
                onClick={() =>
                  onDeleteRecurring({
                    ruleId: selectedRule.id,
                    fromMonth: selectedRule.startMonth,
                    scope: "ALL",
                  })
                }
              >
                Excluir recorrencia (tudo)
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
