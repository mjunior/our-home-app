interface ConsolidatedBalanceCardProps {
  amount: string;
}

export function ConsolidatedBalanceCard({ amount }: ConsolidatedBalanceCardProps) {
  return (
    <section aria-label="Saldo consolidado" className="panel">
      <p className="text-sm uppercase tracking-[0.15em] text-slate-500 dark:text-slate-300">Saldo consolidado das contas</p>
      <strong data-testid="consolidated-balance" className="text-3xl text-brand-teal dark:text-brand-lime">
        R$ {amount}
      </strong>
      {amount === "0.00" ? <p>Adicione uma conta para visualizar saldo inicial.</p> : null}
    </section>
  );
}
