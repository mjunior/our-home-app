import { useState } from "react";

import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../lib/utils";

export interface AccountFormValues {
  name: string;
  openingBalance: string;
  type: "CHECKING" | "INVESTMENT";
}

interface AccountFormProps {
  onSubmit: (values: AccountFormValues) => void;
}

export function AccountForm({ onSubmit }: AccountFormProps) {
  const [name, setName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0,00");
  const [type, setType] = useState<"CHECKING" | "INVESTMENT">("CHECKING");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, openingBalance: currencyInputToDecimal(openingBalance), type });
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
          inputMode="numeric"
          value={openingBalance}
          onChange={(event) => setOpeningBalance(formatCurrencyInputBRL(event.target.value))}
        />
      </label>
      <label>
        Tipo
        <select aria-label="Tipo da conta" value={type} onChange={(event) => setType(event.target.value as any)}>
          <option value="CHECKING">Conta corrente</option>
          <option value="INVESTMENT">Conta investimento</option>
        </select>
      </label>
      <button type="submit">Adicionar conta</button>
    </form>
  );
}
