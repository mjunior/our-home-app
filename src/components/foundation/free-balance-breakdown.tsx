import type { FreeBalanceMonthBreakdown } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceBreakdownProps {
  current: FreeBalanceMonthBreakdown;
  next: FreeBalanceMonthBreakdown;
}

function MonthBlock({ title, data }: { title: string; data: FreeBalanceMonthBreakdown }) {
  return (
    <article style={{ border: "1px solid #ececec", borderRadius: 10, padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        <li>Saldo contas: R$ {data.components.accountStartingBalance}</li>
        <li>Entradas: R$ {data.components.projectedIncome}</li>
        <li>Fatura cartao: R$ {data.components.cardInvoiceDue}</li>
        <li>Parcelas: R$ {data.components.installments}</li>
        <li>Recorrencias: R$ {data.components.recurrences}</li>
        <li>Despesas avulsas: R$ {data.components.oneOffExpenses}</li>
        <li>Atrasos carregados: R$ {data.components.lateCarry}</li>
      </ul>
      <p style={{ marginBottom: 0, marginTop: 10 }}>
        Saldo livre do mes: <strong>R$ {data.freeBalance}</strong>
      </p>
    </article>
  );
}

export function FreeBalanceBreakdown({ current, next }: FreeBalanceBreakdownProps) {
  return (
    <section aria-label="Composicao saldo livre">
      <h2>Composicao do Saldo Livre</h2>
      <div style={{ display: "grid", gap: 10 }}>
        <MonthBlock title={`Mes atual (${current.month})`} data={current} />
        <MonthBlock title={`Proximo mes (${next.month})`} data={next} />
      </div>
    </section>
  );
}
