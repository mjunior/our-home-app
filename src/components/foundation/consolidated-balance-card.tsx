interface ConsolidatedBalanceCardProps {
  amount: string;
}

export function ConsolidatedBalanceCard({ amount }: ConsolidatedBalanceCardProps) {
  return (
    <section aria-label="Saldo consolidado" style={{ border: "1px solid #d2d6dc", padding: 16, borderRadius: 12 }}>
      <p>Saldo consolidado das contas</p>
      <strong data-testid="consolidated-balance">R$ {amount}</strong>
      {amount === "0.00" ? <p>Adicione uma conta para visualizar saldo inicial.</p> : null}
    </section>
  );
}
