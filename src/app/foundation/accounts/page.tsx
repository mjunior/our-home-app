import { useMemo, useState } from "react";

import { AccountForm } from "../../../components/foundation/account-form";
import { ConsolidatedBalanceCard } from "../../../components/foundation/consolidated-balance-card";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { accountsController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function AccountsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { notify } = useSnackbar();
  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const consolidated = useMemo(() => accountsController.getConsolidatedBalance(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <h1>Contas</h1>
        <Badge variant="secondary">Foundation</Badge>
      </section>

      <ConsolidatedBalanceCard amount={consolidated.amount} />
      <AccountForm
        onSubmit={(values) => {
          try {
            accountsController.createAccount({ householdId: HOUSEHOLD_ID, ...values });
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Conta cadastrada com sucesso.", tone: "success" });
          } catch {
            notify({ message: "Nao foi possivel cadastrar a conta.", tone: "error" });
          }
        }}
      />

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Contas cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {accounts.map((account) => (
              <li key={account.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70">
                {account.name} - {account.type} - R$ {account.openingBalance}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
