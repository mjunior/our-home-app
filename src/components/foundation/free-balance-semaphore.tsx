import type { FreeBalanceRiskLevel } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceSemaphoreProps {
  freeBalanceCurrent: string;
  freeBalanceNext: string;
  additionalCardSpendCapacity: string;
  risk: FreeBalanceRiskLevel;
}

const stylesByRisk: Record<FreeBalanceRiskLevel, { badge: string; title: string; ring: string }> = {
  GREEN: { badge: "bg-emerald-500 text-white", title: "Saudavel", ring: "ring-emerald-300/60" },
  YELLOW: { badge: "bg-amber-500 text-slate-950", title: "Atencao", ring: "ring-amber-300/60" },
  RED: { badge: "bg-red-500 text-white", title: "Risco", ring: "ring-red-300/60" },
};

export function FreeBalanceSemaphore({
  freeBalanceCurrent,
  freeBalanceNext,
  additionalCardSpendCapacity,
  risk,
}: FreeBalanceSemaphoreProps) {
  const style = stylesByRisk[risk];

  return (
    <section aria-label="Semaforo saldo livre" className={`panel ring-2 ${style.ring}`}>
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl">Saldo Livre</h2>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-300">decisao principal</p>
        </div>
        <span data-testid="free-balance-risk" className={`rounded-full px-3 py-1 text-xs font-extrabold uppercase ${style.badge}`}>
          {style.title}
        </span>
      </header>

      <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
        <p data-testid="free-balance-current" className="text-sm">
          Mes atual: <strong>R$ {freeBalanceCurrent}</strong>
        </p>
        <p data-testid="free-balance-next" className="text-sm">
          Proximo mes: <strong>R$ {freeBalanceNext}</strong>
        </p>
        <p data-testid="free-balance-card-capacity" className="text-sm text-brand-teal dark:text-brand-lime">
          Pode aumentar no cartao: <strong>R$ {additionalCardSpendCapacity}</strong>
        </p>
      </div>
    </section>
  );
}
