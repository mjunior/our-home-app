import type { FreeBalanceMonthBreakdown } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceBreakdownProps {
  current: FreeBalanceMonthBreakdown;
  next: FreeBalanceMonthBreakdown;
}

function MonthBlock({ title, data }: { title: string; data: FreeBalanceMonthBreakdown }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="mb-2 text-base">{title}</h3>
      <ul className="space-y-1 text-sm">
        <li>Saldo contas: R$ {data.components.accountStartingBalance}</li>
        <li>Entradas: R$ {data.components.projectedIncome}</li>
        <li>Fatura cartao: R$ {data.components.cardInvoiceDue}</li>
        <li>Parcelas: R$ {data.components.installments}</li>
        <li>Recorrencias: R$ {data.components.recurrences}</li>
        <li>Despesas avulsas: R$ {data.components.oneOffExpenses}</li>
        <li>Atrasos carregados: R$ {data.components.lateCarry}</li>
      </ul>
      <p className="mt-3 text-sm">
        Saldo livre do mes: <strong>R$ {data.freeBalance}</strong>
      </p>
    </article>
  );
}

export function FreeBalanceBreakdown({ current, next }: FreeBalanceBreakdownProps) {
  return (
    <section aria-label="Composicao saldo livre" className="panel">
      <h2 className="mb-3">Composicao do Saldo Livre</h2>
      <div className="grid gap-2">
        <MonthBlock title={`Mes atual (${current.month})`} data={current} />
        <MonthBlock title={`Proximo mes (${next.month})`} data={next} />
      </div>
    </section>
  );
}
