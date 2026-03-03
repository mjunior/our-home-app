import { useMemo, useState } from "react";

import { InstallmentForm } from "../../../components/foundation/installment-form";
import { RecurrenceForm } from "../../../components/foundation/recurrence-form";
import { ScheduleList } from "../../../components/foundation/schedule-list";
import { accountsController, cardsController, categoriesController, scheduleManagementController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function SchedulesPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const cards = useMemo(() => cardsController.listCards(HOUSEHOLD_ID), [refreshKey]);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  const schedules = useMemo(() => scheduleManagementController.listSchedules(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main>
      <h1>Parcelas e Recorrencias</h1>

      <RecurrenceForm
        accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
        cards={cards.map((item) => ({ id: item.id, label: item.name }))}
        categories={categories.map((item) => ({ id: item.id, label: item.name }))}
        onSubmit={(values) => {
          scheduleManagementController.createRecurringSchedule({ householdId: HOUSEHOLD_ID, ...values });
          setRefreshKey((prev) => prev + 1);
        }}
      />

      <InstallmentForm
        accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
        cards={cards.map((item) => ({ id: item.id, label: item.name }))}
        categories={categories.map((item) => ({ id: item.id, label: item.name }))}
        onSubmit={(values) => {
          scheduleManagementController.createInstallmentSchedule({ householdId: HOUSEHOLD_ID, ...values });
          setRefreshKey((prev) => prev + 1);
        }}
      />

      <ScheduleList
        installments={schedules.installments}
        recurrences={schedules.recurrences}
        instances={schedules.instances}
        onEditRecurring={(payload) => {
          scheduleManagementController.editRecurringSchedule(payload);
          setRefreshKey((prev) => prev + 1);
        }}
        onStopRecurring={(payload) => {
          scheduleManagementController.stopRecurringSchedule(payload);
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </main>
  );
}
