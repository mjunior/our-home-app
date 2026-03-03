import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import type { FreeBalanceTopDriver } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceCausesProps {
  topDrivers: FreeBalanceTopDriver[];
}

export function FreeBalanceCauses({ topDrivers }: FreeBalanceCausesProps) {
  return (
    <Card aria-label="Top causas saldo livre" className="section-reveal">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Top 3 causas de pressao</CardTitle>
        <Badge variant="outline">Radar</Badge>
      </CardHeader>
      <CardContent>
        {topDrivers.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-300">Nenhuma pressao relevante encontrada.</p>
        ) : (
          <ol data-testid="free-balance-top-causes" className="space-y-2">
            {topDrivers.map((driver) => (
              <li
                key={`${driver.label}-${driver.month}`}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <strong>{driver.label}</strong>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{driver.month}</p>
                  </div>
                  <span className="font-semibold text-red-500">R$ {driver.amount}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
