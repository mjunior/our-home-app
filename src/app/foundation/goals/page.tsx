import { useMemo, useState } from "react";

import { GoalForm, goalTypeLabel, type GoalType } from "../../../components/foundation/goal-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { useSnackbar } from "../../../components/ui/snackbar";
import { getRuntimeHouseholdId, goalsController } from "../runtime";

function formatDate(value: string | null) {
  if (!value) return "Sem data alvo";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data alvo";
  return date.toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

export default function GoalsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const goals = useMemo(() => goalsController.listGoals(householdId), [refreshKey, householdId]);
  const editingGoal = useMemo(() => goals.find((item) => item.id === editingGoalId) ?? null, [editingGoalId, goals]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Metas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Mapeie objetivos financeiros, pessoais e da familia.</p>
        </div>
        <Button type="button" onClick={() => setCreateModalOpen(true)}>
          Nova meta
        </Button>
      </section>

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Metas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? <p className="text-sm text-slate-500 dark:text-slate-300">Nenhuma meta cadastrada ainda.</p> : null}
          <ul className="space-y-3">
            {goals.map((goal) => (
              <li key={goal.id} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{goal.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{goal.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingGoalId(goal.id);
                      setEditModalOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <Badge variant="secondary">{goalTypeLabel(goal.type as GoalType)}</Badge>
                  <span>{formatDate(goal.targetDate)}</span>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Sheet open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Nova meta</SheetTitle>
            <SheetDescription>Cadastre titulo, descricao, tipo e data alvo.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <GoalForm
              submitLabel="Salvar meta"
              onSubmit={(values) => {
                try {
                  goalsController.createGoal({ householdId, ...values });
                  setRefreshKey((prev) => prev + 1);
                  setCreateModalOpen(false);
                  notify({ message: "Meta cadastrada com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel cadastrar a meta.", tone: "error" });
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={editModalOpen}
        onOpenChange={(open) => {
          setEditModalOpen(open);
          if (!open) {
            setEditingGoalId(null);
          }
        }}
      >
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Editar meta</SheetTitle>
            <SheetDescription>Atualize as informacoes da meta.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {editingGoal ? (
              <GoalForm
                submitLabel="Salvar alteracoes"
                initialValues={{
                  title: editingGoal.title,
                  description: editingGoal.description,
                  type: editingGoal.type,
                  targetDate: editingGoal.targetDate ? editingGoal.targetDate.slice(0, 10) : "",
                }}
                onSubmit={(values) => {
                  try {
                    goalsController.updateGoal({ householdId, id: editingGoal.id, ...values });
                    setRefreshKey((prev) => prev + 1);
                    setEditModalOpen(false);
                    setEditingGoalId(null);
                    notify({ message: "Meta atualizada com sucesso.", tone: "success" });
                  } catch {
                    notify({ message: "Nao foi possivel atualizar a meta.", tone: "error" });
                  }
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
