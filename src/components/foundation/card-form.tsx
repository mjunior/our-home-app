import { useState } from "react";

export interface CardFormValues {
  name: string;
  closeDay: number;
  dueDay: number;
}

interface CardFormProps {
  onSubmit: (values: CardFormValues) => void;
  initialValues?: CardFormValues;
  submitLabel?: string;
  onCancel?: () => void;
}

export function CardForm({ onSubmit, initialValues, submitLabel = "Adicionar cartao", onCancel }: CardFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [closeDay, setCloseDay] = useState(initialValues?.closeDay ?? 5);
  const [dueDay, setDueDay] = useState(initialValues?.dueDay ?? 12);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, closeDay, dueDay });
        if (!initialValues) {
          setName("");
          setCloseDay(5);
          setDueDay(12);
        }
      }}
    >
      <label>
        Nome do cartao
        <input aria-label="Nome do cartao" value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <label>
        Dia de fechamento
        <input
          aria-label="Dia de fechamento"
          type="number"
          value={closeDay}
          onChange={(event) => setCloseDay(Number(event.target.value))}
        />
      </label>
      <label>
        Dia de vencimento
        <input
          aria-label="Dia de vencimento"
          type="number"
          value={dueDay}
          onChange={(event) => setDueDay(Number(event.target.value))}
        />
      </label>
      <button type="submit">{submitLabel}</button>
      {onCancel ? <button type="button" onClick={onCancel}>Cancelar</button> : null}
    </form>
  );
}
