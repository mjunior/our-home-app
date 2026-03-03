import type { FreeBalanceAlert as AlertItem, FreeBalanceConfidence } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceAlertProps {
  alerts: AlertItem[];
  confidence: FreeBalanceConfidence;
  missingData: string[];
}

const tone = {
  info: { bg: "#eff6ff", border: "#93c5fd" },
  warning: { bg: "#fffbeb", border: "#f59e0b" },
  danger: { bg: "#fef2f2", border: "#ef4444" },
};

export function FreeBalanceAlert({ alerts, confidence, missingData }: FreeBalanceAlertProps) {
  return (
    <section aria-label="Alertas saldo livre">
      <h2>Alertas e Sugestoes</h2>
      <div style={{ display: "grid", gap: 10 }}>
        {alerts.map((alert, index) => (
          <article
            key={`${alert.title}-${index}`}
            data-testid={`free-balance-alert-${alert.level}`}
            style={{ background: tone[alert.level].bg, border: `1px solid ${tone[alert.level].border}`, borderRadius: 10, padding: 12 }}
          >
            <h3 style={{ marginTop: 0 }}>{alert.title}</h3>
            <p>{alert.message}</p>
            {alert.suggestions.length > 0 ? (
              <ul style={{ marginBottom: 0 }}>
                {alert.suggestions.map((suggestion) => (
                  <li key={suggestion}>{suggestion}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>

      {confidence === "LOW" ? (
        <p data-testid="free-balance-confidence-low" style={{ marginTop: 10 }}>
          Projecao com baixa confiabilidade. Pendencias: {missingData.join(" | ")}
        </p>
      ) : null}
    </section>
  );
}
