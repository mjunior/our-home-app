import { useState } from "react";

export interface AccountFormValues {
  name: string;
  openingBalance: string;
  type: "CHECKING" | "SAVINGS" | "CASH";
}

interface AccountFormProps {
  onSubmit: (values: AccountFormValues) => void;
}

export function AccountForm({ onSubmit }: AccountFormProps) {
  const [name, setName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0.00");
  const [type, setType] = useState<"CHECKING" | "SAVINGS" | "CASH">("CHECKING");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, openingBalance, type });
        setName("");
      }}
    >
      <label>
        Nome da conta
        <input aria-label="Nome da conta" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Saldo inicial
        <input
          aria-label="Saldo inicial"
          value={openingBalance}
          onChange={(event) => setOpeningBalance(event.target.value)}
        />
      </label>
      <label>
        Tipo
        <select aria-label="Tipo da conta" value={type} onChange={(event) => setType(event.target.value as any)}>
          <option value="CHECKING">Conta corrente</option>
          <option value="SAVINGS">Poupanca</option>
          <option value="CASH">Dinheiro</option>
        </select>
      </label>
      <button type="submit">Adicionar conta</button>
    </form>
  );
}
