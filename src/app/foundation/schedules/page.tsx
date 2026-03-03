import { useMemo, useState } from "react";

import { InstallmentForm } from "../../../components/foundation/installment-form";
import { RecurrenceForm } from "../../../components/foundation/recurrence-form";
import { ScheduleList } from "../../../components/foundation/schedule-list";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { accountsController, cardsController, categoriesController, scheduleManagementController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function SchedulesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { notify } = useSnackbar();

  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const cards = useMemo(() => cardsController.listCards(HOUSEHOLD_ID), [refreshKey]);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  const schedules = useMemo(() => scheduleManagementController.listSchedules(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <h1>Parcelas e Recorrencias</h1>
        <Badge variant="secondary">Foundation</Badge>
      </section>

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Nova recorrencia</CardTitle>
        </CardHeader>
        <CardContent>
          <RecurrenceForm
            accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
            cards={cards.map((item) => ({ id: item.id, label: item.name }))}
            categories={categories.map((item) => ({ id: item.id, label: item.name }))}
            onSubmit={(values) => {
              try {
                scheduleManagementController.createRecurringSchedule({ householdId: HOUSEHOLD_ID, ...values });
                setRefreshKey((prev) => prev + 1);
                notify({ message: "Recorrencia cadastrada com sucesso.", tone: "success" });
              } catch {
                notify({ message: "Nao foi possivel cadastrar a recorrencia.", tone: "error" });
              }
            }}
          />
        </CardContent>
      </Card>

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Novo parcelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <InstallmentForm
            accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
            cards={cards.map((item) => ({ id: item.id, label: item.name }))}
            categories={categories.map((item) => ({ id: item.id, label: item.name }))}
            onSubmit={(values) => {
              try {
                scheduleManagementController.createInstallmentSchedule({ householdId: HOUSEHOLD_ID, ...values });
                setRefreshKey((prev) => prev + 1);
                notify({ message: "Parcela cadastrada com sucesso.", tone: "success" });
              } catch {
                notify({ message: "Nao foi possivel cadastrar a parcela.", tone: "error" });
              }
            }}
          />
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
      />
    </main>
  );
}
