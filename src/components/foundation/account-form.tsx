import { useEffect, useState } from "react";

import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../lib/utils";
import { Button } from "../ui/button";

export interface AccountFormValues {
  name: string;
  openingBalance: string;
  type: "CHECKING" | "INVESTMENT";
  goalAmount?: string;
}

interface AccountFormProps {
  onSubmit: (values: AccountFormValues) => void;
  submitLabel?: string;
  initialValues?: Partial<AccountFormValues>;
}

export function AccountForm({ onSubmit, submitLabel = "Adicionar conta", initialValues }: AccountFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [openingBalance, setOpeningBalance] = useState(initialValues?.openingBalance ?? "0,00");
  const [type, setType] = useState<"CHECKING" | "INVESTMENT">(initialValues?.type ?? "CHECKING");
  const [goalAmount, setGoalAmount] = useState(initialValues?.goalAmount ?? "");

  useEffect(() => {
    setName(initialValues?.name ?? "");
    setOpeningBalance(initialValues?.openingBalance ?? "0,00");
    setType(initialValues?.type ?? "CHECKING");
    setGoalAmount(initialValues?.goalAmount ?? "");
  }, [initialValues]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          name,
          openingBalance: currencyInputToDecimal(openingBalance),
          type,
          goalAmount: type === "INVESTMENT" && goalAmount.trim() ? currencyInputToDecimal(goalAmount) : undefined,
        });
        setName("");
        setOpeningBalance("0,00");
        setType("CHECKING");
        setGoalAmount("");
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
      {type === "INVESTMENT" ? (
        <label>
          Objetivo da conta
          <input
            aria-label="Objetivo da conta"
            inputMode="numeric"
            placeholder="Ex: 10.000,00"
            value={goalAmount}
            onChange={(event) => setGoalAmount(formatCurrencyInputBRL(event.target.value))}
          />
        </label>
      ) : null}
      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
