import type { TransactionRecord } from "../../modules/transactions/transactions.repository";

interface StatementTableProps {
  entries: TransactionRecord[];
}

export function StatementTable({ entries }: StatementTableProps) {
  if (entries.length === 0) {
    return <p>Nenhum lancamento para o filtro atual.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Tipo</th>
          <th>Descricao</th>
          <th>Valor</th>
          <th>Categoria</th>
          <th>Destino</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr key={entry.id}>
            <td>{entry.occurredAt.slice(0, 10)}</td>
            <td>{entry.kind}</td>
            <td>{entry.description}</td>
            <td>R$ {entry.amount}</td>
            <td>{entry.categoryId}</td>
            <td>{entry.accountId ?? entry.creditCardId}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
