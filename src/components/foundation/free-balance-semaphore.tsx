import { CircleHelp, TrendingDown, TrendingUp } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import { formatCurrencyBR } from "../../lib/utils";
import type { FreeBalanceRiskLevel } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceSemaphoreProps {
  freeBalanceCurrent: string;
  freeBalanceNext: string;
  additionalCardSpendCapacity: string;
  risk: FreeBalanceRiskLevel;
  onOpenCurrentDetails?: () => void;
  onOpenNextDetails?: () => void;
}

const stylesByRisk: Record<
  FreeBalanceRiskLevel,
  { badge: "lime" | "destructive" | "secondary"; title: string; ring: string; accent: string }
> = {
  GREEN: { badge: "lime", title: "Saudavel", ring: "ring-emerald-300/50", accent: "text-emerald-600 dark:text-emerald-400" },
  YELLOW: { badge: "secondary", title: "Atencao", ring: "ring-amber-300/60", accent: "text-amber-600 dark:text-amber-400" },
  RED: { badge: "destructive", title: "Risco", ring: "ring-red-300/60", accent: "text-red-600 dark:text-red-400" },
};

export function FreeBalanceSemaphore({
  freeBalanceCurrent,
  freeBalanceNext,
  additionalCardSpendCapacity,
  risk,
  onOpenCurrentDetails,
  onOpenNextDetails,
}: FreeBalanceSemaphoreProps) {
  const style = stylesByRisk[risk];

  return (
    <Card aria-label="Semaforo saldo livre" className={`stagger-up ring-2 ${style.ring}`}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">saldo livre mensal</p>
          <CardTitle className="mt-1 text-2xl">{formatCurrencyBR(freeBalanceCurrent)}</CardTitle>
          <p data-testid="free-balance-current" className="sr-only">
            {formatCurrencyBR(freeBalanceCurrent)}
          </p>
        </div>
        <Badge data-testid="free-balance-risk" variant={style.badge}>
          {style.title}
        </Badge>
      </CardHeader>

      <CardContent className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Mes atual</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              aria-label="Detalhar saldo livre do mes atual"
              onClick={onOpenCurrentDetails}
            >
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-1 text-lg font-bold">{formatCurrencyBR(freeBalanceCurrent)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Proximo mes</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              aria-label="Detalhar saldo livre do proximo mes"
              onClick={onOpenNextDetails}
            >
              <CircleHelp className="h-4 w-4" />
            </Button>
          </div>
          <p data-testid="free-balance-next" className="mt-1 text-lg font-bold">
            {formatCurrencyBR(freeBalanceNext)}
          </p>
          <div className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${style.accent}`}>
            {risk === "RED" ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
            Projecao
          </div>
        </article>

        <article className="rounded-2xl border border-brand-teal/30 bg-brand-teal/5 p-3 dark:border-brand-lime/30 dark:bg-brand-lime/5">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Pode aumentar no cartao</p>
          <p data-testid="free-balance-card-capacity" className="mt-1 text-lg font-bold text-brand-teal dark:text-brand-lime">
            {formatCurrencyBR(additionalCardSpendCapacity)}
          </p>
        </article>
      </CardContent>
    </Card>
  );
}
