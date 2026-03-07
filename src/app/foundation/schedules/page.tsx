import { useMemo, useState } from "react";

import { ScheduleList } from "../../../components/foundation/schedule-list";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { accountsController, cardsController, categoriesController, getRuntimeHouseholdId, scheduleManagementController } from "../runtime";

export default function SchedulesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();

  const accounts = useMemo(() => accountsController.listAccounts(householdId), [refreshKey, householdId]);
  const cards = useMemo(() => cardsController.listCards(householdId), [refreshKey, householdId]);
  const categories = useMemo(() => categoriesController.listCategories(householdId), [refreshKey, householdId]);

  const schedules = useMemo(() => scheduleManagementController.listSchedules(householdId), [refreshKey, householdId]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <h1>Gerenciamento de Compromissos</h1>
        <Badge variant="secondary">Foundation</Badge>
      </section>

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Criacao centralizada no Cashflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Novos avulsos, recorrencias e parcelamentos sao criados pelo botao <strong>Novo lancamento</strong> no Cashflow.
            Esta tela fica dedicada para consulta e manutencao future-only.
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Contas: {accounts.length} | Cartoes: {cards.length} | Categorias: {categories.length}
          </p>
        </CardContent>
      </Card>

      <ScheduleList
        installments={schedules.installments}
        recurrences={schedules.recurrences}
        instances={schedules.instances}
        onEditRecurring={(payload) => {
          try {
            scheduleManagementController.editRecurringSchedule(payload);
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Recorrencia editada com sucesso.", tone: "info" });
          } catch {
            notify({ message: "Nao foi possivel editar a recorrencia.", tone: "error" });
          }
        }}
        onStopRecurring={(payload) => {
          try {
            scheduleManagementController.stopRecurringSchedule(payload);
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Recorrencia encerrada.", tone: "info" });
          } catch {
            notify({ message: "Nao foi possivel encerrar a recorrencia.", tone: "error" });
          }
        }}
        onDeleteRecurring={(payload) => {
          try {
            scheduleManagementController.deleteRecurringSchedule(payload);
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Recorrencia excluida com sucesso.", tone: "success" });
          } catch {
            notify({ message: "Nao foi possivel excluir a recorrencia.", tone: "error" });
          }
        }}
      />
    </main>
  );
}
