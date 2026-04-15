import { useEffect, useMemo, useState } from "react";

import { AccountForm } from "../../../components/foundation/account-form";
import { ConsolidatedBalanceCard } from "../../../components/foundation/consolidated-balance-card";
import { Button } from "../../../components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { useSnackbar } from "../../../components/ui/snackbar";
import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../../lib/utils";
import { accountsController, getRuntimeHouseholdId } from "../runtime";

function getTodayInputDefaults() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return {
    month: `${year}-${month}`,
    date: `${year}-${month}-${day}`,
  };
}

export default function AccountsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createAccountModalOpen, setCreateAccountModalOpen] = useState(false);
  const [editGoalModalOpen, setEditGoalModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [goalAmountInput, setGoalAmountInput] = useState("");
  const [adjustingAccountId, setAdjustingAccountId] = useState<string | null>(null);
  const [adjustmentRealBalance, setAdjustmentRealBalance] = useState("");
  const [adjustmentMonth, setAdjustmentMonth] = useState(() => getTodayInputDefaults().month);
  const [adjustmentDate, setAdjustmentDate] = useState(() => getTodayInputDefaults().date);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const consolidated = useMemo(() => accountsController.getConsolidatedBalance(householdId), [refreshKey, householdId]);
  const editingAccount = useMemo(
    () => consolidated.accounts.find((account) => account.id === editingAccountId) ?? null,
    [consolidated.accounts, editingAccountId],
  );
  const adjustingAccount = useMemo(
    () => consolidated.accounts.find((account) => account.id === adjustingAccountId) ?? null,
    [consolidated.accounts, adjustingAccountId],
  );

  useEffect(() => {
    setGoalAmountInput(editingAccount?.goalAmount ? formatCurrencyInputBRL(editingAccount.goalAmount) : "");
  }, [editingAccount]);

  function resetAdjustmentState() {
    const defaults = getTodayInputDefaults();
    setAdjustingAccountId(null);
    setAdjustmentRealBalance("");
    setAdjustmentMonth(defaults.month);
    setAdjustmentDate(defaults.date);
  }

  function startAdjustment(accountId: string) {
    const defaults = getTodayInputDefaults();
    setAdjustingAccountId(accountId);
    setAdjustmentRealBalance("");
    setAdjustmentMonth(defaults.month);
    setAdjustmentDate(defaults.date);
  }

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

      <ConsolidatedBalanceCard
        amount={consolidated.amount}
        byType={consolidated.byType}
        accounts={consolidated.accounts}
        onEditInvestmentGoal={(accountId) => {
          setEditingAccountId(accountId);
          setEditGoalModalOpen(true);
        }}
        onAdjustAccount={startAdjustment}
      />

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

      <Sheet
        open={adjustingAccount !== null}
        onOpenChange={(open) => {
          if (!open) {
            resetAdjustmentState();
          }
        }}
      >
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Reajustar saldo</SheetTitle>
            <SheetDescription>
              {adjustingAccount ? `Informe o saldo real da conta ${adjustingAccount.name}.` : "Selecione uma conta para reajustar."}
            </SheetDescription>
          </SheetHeader>
          {adjustingAccount ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  accountsController.createAccountAdjustment({
                    householdId,
                    accountId: adjustingAccount.id,
                    realBalance: currencyInputToDecimal(adjustmentRealBalance),
                    month: adjustmentMonth,
                    occurredAt: `${adjustmentDate}T12:00:00.000Z`,
                  });
                  setRefreshKey((prev) => prev + 1);
                  resetAdjustmentState();
                  notify({ message: "Reajuste lancado com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel lancar o reajuste.", tone: "error" });
                }
              }}
            >
              <div className="rounded-2xl border border-brand-teal/15 bg-brand-teal/5 p-4 text-sm dark:border-brand-lime/20 dark:bg-brand-lime/5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{adjustingAccount.name}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">Saldo atual no app: R$ {adjustingAccount.balance}</p>
              </div>

              <label>
                Valor real
                <input
                  aria-label="Valor real"
                  inputMode="numeric"
                  placeholder="Ex: 650,00"
                  value={adjustmentRealBalance}
                  onChange={(event) => setAdjustmentRealBalance(formatCurrencyInputBRL(event.target.value))}
                />
              </label>

              <label>
                Mes de competencia
                <input
                  aria-label="Mes de competencia"
                  type="month"
                  value={adjustmentMonth}
                  onChange={(event) => setAdjustmentMonth(event.target.value)}
                />
              </label>

              <label>
                Data do reajuste
                <input
                  aria-label="Data do reajuste"
                  type="date"
                  value={adjustmentDate}
                  onChange={(event) => setAdjustmentDate(event.target.value)}
                />
              </label>

              <Button type="submit">Salvar reajuste</Button>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet
        open={editGoalModalOpen}
        onOpenChange={(open) => {
          setEditGoalModalOpen(open);
          if (!open) {
            setEditingAccountId(null);
          }
        }}
      >
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Editar objetivo</SheetTitle>
            <SheetDescription>
              {editingAccount ? `Atualize a meta da conta ${editingAccount.name}.` : "Selecione uma conta de investimento."}
            </SheetDescription>
          </SheetHeader>
          {editingAccount ? (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                try {
                  accountsController.updateAccountGoal({
                    householdId,
                    id: editingAccount.id,
                    goalAmount: goalAmountInput.trim() ? currencyInputToDecimal(goalAmountInput) : null,
                  });
                  setRefreshKey((prev) => prev + 1);
                  setEditGoalModalOpen(false);
                  setEditingAccountId(null);
                  notify({ message: "Objetivo atualizado com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel atualizar o objetivo.", tone: "error" });
                }
              }}
            >
              <div className="rounded-2xl border border-brand-teal/15 bg-brand-teal/5 p-4 text-sm dark:border-brand-lime/20 dark:bg-brand-lime/5">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{editingAccount.name}</p>
                <p className="mt-1 text-slate-600 dark:text-slate-300">Saldo atual: R$ {editingAccount.balance}</p>
              </div>

              <label>
                Objetivo da conta
                <input
                  aria-label="Objetivo da conta"
                  inputMode="numeric"
                  placeholder="Ex: 10.000,00"
                  value={goalAmountInput}
                  onChange={(event) => setGoalAmountInput(formatCurrencyInputBRL(event.target.value))}
                />
              </label>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1">
                  Salvar objetivo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    try {
                      accountsController.updateAccountGoal({
                        householdId,
                        id: editingAccount.id,
                        goalAmount: null,
                      });
                      setRefreshKey((prev) => prev + 1);
                      setGoalAmountInput("");
                      setEditGoalModalOpen(false);
                      setEditingAccountId(null);
                      notify({ message: "Objetivo removido com sucesso.", tone: "success" });
                    } catch {
                      notify({ message: "Nao foi possivel remover o objetivo.", tone: "error" });
                    }
                  }}
                >
                  Remover objetivo
                </Button>
              </div>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </main>
  );
}
