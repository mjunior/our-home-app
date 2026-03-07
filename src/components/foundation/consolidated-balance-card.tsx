import { Badge } from "../ui/badge";
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
  }>;
}

export function ConsolidatedBalanceCard({ amount, byType, accounts }: ConsolidatedBalanceCardProps) {
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
              <p className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">{account.name}</p>
              <p className={`mt-1 text-3xl font-black tracking-tight ${account.type === "INVESTMENT" ? "text-brand-teal dark:text-brand-lime" : ""}`}>
                R$ {account.balance}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {account.type === "INVESTMENT" ? "Investimento" : "Corrente"}
              </p>
            </div>
          ))}
        </div>

        {amount === "0.00" ? <p className="text-sm text-slate-500 dark:text-slate-300">Adicione uma conta para visualizar saldo inicial.</p> : null}
      </CardContent>
    </Card>
  );
}
