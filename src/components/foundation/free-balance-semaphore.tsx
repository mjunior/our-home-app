import { CircleHelp, TrendingDown, TrendingUp } from "lucide-react";

import { Button } from "../ui/button";

import { formatCurrencyBR } from "../../lib/utils";
import type { FreeBalanceRiskLevel } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceSemaphoreProps {
  currentBalance: string;
  currentProjectedBalance: string;
  freeBalanceNext: string;
  gastosOperacionais: string;
  investimentos: string;
  totalSaidas: string;
  risk: FreeBalanceRiskLevel;
  onOpenCurrentDetails?: () => void;
  onOpenNextDetails?: () => void;
}

const stylesByRisk: Record<
  FreeBalanceRiskLevel,
  { title: string; ring: string; accent: string }
> = {
  GREEN: { title: "Saudavel", ring: "ring-emerald-300/50", accent: "text-emerald-600 dark:text-emerald-400" },
  YELLOW: { title: "Atencao", ring: "ring-amber-300/60", accent: "text-amber-600 dark:text-amber-400" },
  RED: { title: "Risco", ring: "ring-red-300/60", accent: "text-red-600 dark:text-red-400" },
};

export function FreeBalanceSemaphore({
  currentBalance,
  currentProjectedBalance,
  freeBalanceNext,
  gastosOperacionais,
  investimentos,
  totalSaidas,
  risk,
  onOpenCurrentDetails,
  onOpenNextDetails,
}: FreeBalanceSemaphoreProps) {
  const style = stylesByRisk[risk];

  return (
    <section aria-label="Semaforo saldo livre" className="stagger-up space-y-3">
      <p data-testid="free-balance-risk" className="sr-only">
        {style.title}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-950/60">
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
          <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">Saldo</p>
          <p data-testid="current-real-balance" className="text-lg font-bold">
            {formatCurrencyBR(currentBalance)}
          </p>
          <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">
            Saldo previsto
          </p>
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200">{formatCurrencyBR(currentProjectedBalance)}</p>
          <p data-testid="free-balance-current" className="sr-only">
            {formatCurrencyBR(currentProjectedBalance)}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-700/80 dark:bg-slate-950/60">
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
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Gastos mes</p>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-300">Gastos operacionais</dt>
              <dd className="font-semibold">{formatCurrencyBR(gastosOperacionais)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2">
              <dt className="text-slate-500 dark:text-slate-300">Investimentos</dt>
              <dd className="font-semibold text-brand-teal dark:text-brand-lime">{formatCurrencyBR(investimentos)}</dd>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-brand-teal/20 pt-1 dark:border-brand-lime/20">
              <dt className="text-slate-700 dark:text-slate-200">Total de saidas</dt>
              <dd data-testid="free-balance-total-outflows" className="font-bold">
                {formatCurrencyBR(totalSaidas)}
              </dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
