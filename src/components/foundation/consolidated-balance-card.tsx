import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface ConsolidatedBalanceCardProps {
  amount: string;
}

export function ConsolidatedBalanceCard({ amount }: ConsolidatedBalanceCardProps) {
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
      <CardContent>
        {amount === "0.00" ? <p className="text-sm text-slate-500 dark:text-slate-300">Adicione uma conta para visualizar saldo inicial.</p> : null}
      </CardContent>
    </Card>
  );
}
