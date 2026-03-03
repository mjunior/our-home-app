import type { FreeBalanceTopDriver } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceCausesProps {
  topDrivers: FreeBalanceTopDriver[];
}

export function FreeBalanceCauses({ topDrivers }: FreeBalanceCausesProps) {
  return (
    <section aria-label="Top causas saldo livre" className="panel">
      <h2 className="mb-2">Top 3 causas de pressao</h2>
      {topDrivers.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-300">Nenhuma pressao relevante encontrada.</p>
      ) : (
        <ol data-testid="free-balance-top-causes" className="space-y-2">
          {topDrivers.map((driver) => (
            <li key={`${driver.label}-${driver.month}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950/70">
              <strong>{driver.label}</strong>
              <span className="ml-2 text-slate-500 dark:text-slate-300">({driver.month})</span>
              <span className="ml-2 font-semibold text-red-500">R$ {driver.amount}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
