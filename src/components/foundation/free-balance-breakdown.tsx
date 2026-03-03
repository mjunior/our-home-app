import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import type { FreeBalanceMonthBreakdown } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceBreakdownProps {
  current: FreeBalanceMonthBreakdown;
  next: FreeBalanceMonthBreakdown;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-3 text-sm">
      <span className="text-slate-500 dark:text-slate-300">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">R$ {value}</span>
    </li>
  );
}

function MonthBlock({ title, data }: { title: string; data: FreeBalanceMonthBreakdown }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <h3 className="mb-2 text-base">{title}</h3>
      <ul className="space-y-1.5">
        <Row label="Saldo contas" value={data.components.accountStartingBalance} />
        <Row label="Entradas" value={data.components.projectedIncome} />
        <Row label="Fatura cartao" value={data.components.cardInvoiceDue} />
        <Row label="Parcelas" value={data.components.installments} />
        <Row label="Recorrencias" value={data.components.recurrences} />
        <Row label="Despesas avulsas" value={data.components.oneOffExpenses} />
        <Row label="Atrasos carregados" value={data.components.lateCarry} />
      </ul>
      <p className="mt-3 border-t border-slate-200 pt-2 text-sm dark:border-slate-800">
        Saldo livre do mes: <strong>R$ {data.freeBalance}</strong>
      </p>
    </article>
  );
}

export function FreeBalanceBreakdown({ current, next }: FreeBalanceBreakdownProps) {
  return (
    <Card aria-label="Composicao saldo livre" className="section-reveal">
      <CardHeader>
        <CardTitle>Composicao do Saldo Livre</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        <MonthBlock title={`Mes atual (${current.month})`} data={current} />
        <MonthBlock title={`Proximo mes (${next.month})`} data={next} />
      </CardContent>
    </Card>
  );
}
