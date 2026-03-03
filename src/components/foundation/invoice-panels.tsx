import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface InvoicePanelData {
  cardName: string;
  current: {
    monthKey: string;
    total: string;
  };
  next: {
    monthKey: string;
    total: string;
  };
}

interface InvoicePanelsProps {
  data: InvoicePanelData | null;
}

export function InvoicePanels({ data }: InvoicePanelsProps) {
  if (!data) {
    return (
      <Card className="section-reveal">
        <CardContent className="pt-5">
          <p className="text-sm text-slate-500 dark:text-slate-300">Sem cartao selecionado para fatura.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card aria-label="Painel de fatura" className="section-reveal">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle>Faturas</CardTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{data.cardName}</p>
        </div>
        <Badge variant="secondary">Cartao selecionado</Badge>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Atual</p>
          <p data-testid="invoice-current" className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            R$ {data.current.total}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-300">Ref: {data.current.monthKey}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Proxima</p>
          <p data-testid="invoice-next" className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            R$ {data.next.total}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-300">Ref: {data.next.monthKey}</p>
        </article>
      </CardContent>
    </Card>
  );
}
