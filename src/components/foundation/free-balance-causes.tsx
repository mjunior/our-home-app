import type { FreeBalanceTopDriver } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceCausesProps {
  topDrivers: FreeBalanceTopDriver[];
}

export function FreeBalanceCauses({ topDrivers }: FreeBalanceCausesProps) {
  return (
    <section aria-label="Top causas saldo livre">
      <h2>Top 3 causas de pressao</h2>
      {topDrivers.length === 0 ? (
        <p>Nenhuma pressao relevante encontrada.</p>
      ) : (
        <ol data-testid="free-balance-top-causes">
          {topDrivers.map((driver) => (
            <li key={`${driver.label}-${driver.month}`}>
              {driver.label} ({driver.month}): R$ {driver.amount}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
