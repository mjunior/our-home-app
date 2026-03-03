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
    return <p className="panel">Sem cartao selecionado para fatura.</p>;
  }

  return (
    <section aria-label="Painel de fatura" className="panel">
      <h2>Faturas - {data.cardName}</h2>
      <p data-testid="invoice-current">
        Atual ({data.current.monthKey}): R$ {data.current.total}
      </p>
      <p data-testid="invoice-next">
        Proxima ({data.next.monthKey}): R$ {data.next.total}
      </p>
    </section>
  );
}
