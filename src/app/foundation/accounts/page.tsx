import { useMemo, useState } from "react";

import { AccountForm } from "../../../components/foundation/account-form";
import { ConsolidatedBalanceCard } from "../../../components/foundation/consolidated-balance-card";
import { accountsController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function AccountsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const consolidated = useMemo(() => accountsController.getConsolidatedBalance(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main className="space-y-4">
      <h1>Contas</h1>
      <ConsolidatedBalanceCard amount={consolidated.amount} />
      <AccountForm
        onSubmit={(values) => {
          accountsController.createAccount({ householdId: HOUSEHOLD_ID, ...values });
          setRefreshKey((prev) => prev + 1);
        }}
      />
      <ul className="panel">
        {accounts.map((account) => (
          <li key={account.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/70">
            {account.name} - {account.type} - R$ {account.openingBalance}
          </li>
        ))}
      </ul>
    </main>
  );
}
