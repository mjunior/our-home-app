import type { FreeBalanceAlert as AlertItem, FreeBalanceConfidence } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceAlertProps {
  alerts: AlertItem[];
  confidence: FreeBalanceConfidence;
  missingData: string[];
}

const tone = {
  info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
  warning: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
  danger: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
};

export function FreeBalanceAlert({ alerts, confidence, missingData }: FreeBalanceAlertProps) {
  return (
    <section aria-label="Alertas saldo livre" className="panel">
      <h2 className="mb-3">Alertas e Sugestoes</h2>
      <div className="grid gap-2">
        {alerts.map((alert, index) => (
          <article key={`${alert.title}-${index}`} data-testid={`free-balance-alert-${alert.level}`} className={`rounded-2xl border p-3 ${tone[alert.level]}`}>
            <h3 className="mb-1 text-sm font-bold">{alert.title}</h3>
            <p className="text-sm">{alert.message}</p>
            {alert.suggestions.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {alert.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      {confidence === "LOW" ? (
        <p data-testid="free-balance-confidence-low" className="mt-3 rounded-xl border border-dashed border-amber-500/50 bg-amber-100/70 p-2 text-sm dark:bg-amber-900/30">
          Projecao com baixa confiabilidade. Pendencias: {missingData.join(" | ")}
        </p>
      ) : null}
    </section>
  );
}
