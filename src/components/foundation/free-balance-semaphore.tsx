import type { FreeBalanceRiskLevel } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceSemaphoreProps {
  freeBalanceCurrent: string;
  freeBalanceNext: string;
  additionalCardSpendCapacity: string;
  risk: FreeBalanceRiskLevel;
}

const stylesByRisk: Record<FreeBalanceRiskLevel, { badge: string; title: string }> = {
  GREEN: { badge: "#1f9d55", title: "Saudavel" },
  YELLOW: { badge: "#d97706", title: "Atenção" },
  RED: { badge: "#dc2626", title: "Risco" },
};

export function FreeBalanceSemaphore({
  freeBalanceCurrent,
  freeBalanceNext,
  additionalCardSpendCapacity,
  risk,
}: FreeBalanceSemaphoreProps) {
  const style = stylesByRisk[risk];

  return (
    <section aria-label="Semaforo saldo livre" style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Saldo Livre</h2>
        <span
          data-testid="free-balance-risk"
          style={{
            backgroundColor: style.badge,
            color: "#fff",
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.4,
          }}
        >
          {style.title}
        </span>
      </header>

      <p data-testid="free-balance-current" style={{ marginBottom: 4 }}>
        Mes atual: R$ {freeBalanceCurrent}
      </p>
      <p data-testid="free-balance-next" style={{ marginTop: 0, marginBottom: 4 }}>
        Proximo mes: R$ {freeBalanceNext}
      </p>
      <p data-testid="free-balance-card-capacity" style={{ marginTop: 0 }}>
        Capacidade adicional no cartao: R$ {additionalCardSpendCapacity}
      </p>
    </section>
  );
}
