import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ConsolidatedBalanceCardProps {
  amount: string;
  byType: {
    CHECKING: string;
    INVESTMENT: string;
  };
  accounts: Array<{
    id: string;
    name: string;
    type: "CHECKING" | "INVESTMENT";
    balance: string;
    goalAmount: string | null;
    goalProgressPercent: number | null;
    remainingToGoal: string | null;
    goalReached: boolean;
  }>;
  onEditInvestmentGoal?: (accountId: string) => void;
  onAdjustAccount?: (accountId: string) => void;
}

export function ConsolidatedBalanceCard({
  amount,
  byType,
  accounts,
  onEditInvestmentGoal,
  onAdjustAccount,
}: ConsolidatedBalanceCardProps) {
  return (
    <Card aria-label="Saldo consolidado" className="section-reveal">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Saldo consolidado das contas</p>
          <CardTitle className="mt-1 text-3xl text-brand-teal dark:text-brand-lime" data-testid="consolidated-balance">
            R$ {amount}
          </CardTitle>
        </div>
        <Badge variant="secondary">Contas</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Conta corrente</p>
            <p className="mt-1 text-lg font-bold">R$ {byType.CHECKING}</p>
          </div>
          <div className="rounded-xl border border-brand-teal/30 bg-brand-teal/5 p-3 text-sm dark:border-brand-lime/30 dark:bg-brand-lime/5">
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Conta investimento</p>
            <p className="mt-1 text-lg font-bold text-brand-teal dark:text-brand-lime">R$ {byType.INVESTMENT}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`rounded-xl border p-4 text-sm shadow-sm ${
                account.type === "INVESTMENT"
                  ? "border-brand-teal/30 bg-brand-teal/5 dark:border-brand-lime/30 dark:bg-brand-lime/10"
                  : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/70"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">{account.name}</p>
                <div className="flex flex-wrap justify-end gap-2">
                  {account.type === "INVESTMENT" && onEditInvestmentGoal ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEditInvestmentGoal(account.id)}
                      aria-label={`Editar objetivo da ${account.name}`}
                    >
                      Editar objetivo
                    </Button>
                  ) : null}
                  {onAdjustAccount ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onAdjustAccount(account.id)}
                      aria-label={`Reajustar saldo da ${account.name}`}
                    >
                      Reajustar
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className={`mt-1 text-3xl font-black tracking-tight ${account.type === "INVESTMENT" ? "text-brand-teal dark:text-brand-lime" : ""}`}>
                R$ {account.balance}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {account.type === "INVESTMENT" ? "Investimento" : "Corrente"}
              </p>
              {account.type === "INVESTMENT" && account.goalAmount ? (
                <div className="mt-4 rounded-2xl border border-brand-teal/15 bg-white/70 p-3 dark:bg-slate-950/30">
                  <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    <span>Objetivo</span>
                    <span>{account.goalProgressPercent?.toFixed(0) ?? "0"}%</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">Meta: R$ {account.goalAmount}</p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-brand-teal/10 dark:bg-brand-lime/10">
                    <div
                      className="h-full rounded-full bg-brand-teal transition-all dark:bg-brand-lime"
                      style={{ width: `${account.goalProgressPercent ?? 0}%` }}
                    />
                  </div>
                  <p
                    className={`mt-3 text-sm font-semibold ${account.goalReached ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-slate-300"}`}
                  >
                    {account.goalReached ? "Objetivo concluido." : `Faltam R$ ${account.remainingToGoal} para atingir a meta.`}
                  </p>
                </div>
              ) : null}
              {account.type === "INVESTMENT" && !account.goalAmount ? (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-300">Defina um objetivo para acompanhar quanto falta atingir.</p>
              ) : null}
            </div>
          ))}
        </div>

        {amount === "0.00" ? <p className="text-sm text-slate-500 dark:text-slate-300">Adicione uma conta para visualizar saldo inicial.</p> : null}
      </CardContent>
    </Card>
  );
}
