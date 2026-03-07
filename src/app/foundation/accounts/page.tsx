import { useMemo, useState } from "react";

import { AccountForm } from "../../../components/foundation/account-form";
import { ConsolidatedBalanceCard } from "../../../components/foundation/consolidated-balance-card";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { useSnackbar } from "../../../components/ui/snackbar";
import { accountsController, getRuntimeHouseholdId } from "../runtime";

export default function AccountsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const consolidated = useMemo(() => accountsController.getConsolidatedBalance(householdId), [refreshKey, householdId]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Contas</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Visualize rapidamente cada conta e seu saldo atual.</p>
        </div>
        <Button type="button" onClick={() => setCreateAccountModalOpen(true)}>
          Nova conta
        </Button>
      </section>

      <ConsolidatedBalanceCard amount={consolidated.amount} byType={consolidated.byType} accounts={consolidated.accounts} />

      <Sheet open={createAccountModalOpen} onOpenChange={setCreateAccountModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Nova conta</SheetTitle>
            <SheetDescription>Cadastre conta corrente ou investimento.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <AccountForm
              onSubmit={(values) => {
                try {
                  accountsController.createAccount({ householdId, ...values });
                  setRefreshKey((prev) => prev + 1);
                  setCreateAccountModalOpen(false);
                  notify({ message: "Conta cadastrada com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel cadastrar a conta.", tone: "error" });
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
