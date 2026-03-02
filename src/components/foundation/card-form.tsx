import { useState } from "react";

export interface CardFormValues {
  name: string;
  closeDay: number;
  dueDay: number;
}

interface CardFormProps {
  onSubmit: (values: CardFormValues) => void;
}

export function CardForm({ onSubmit }: CardFormProps) {
  const [name, setName] = useState("");
  const [closeDay, setCloseDay] = useState(5);
  const [dueDay, setDueDay] = useState(12);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, closeDay, dueDay });
        setName("");
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
      <button type="submit">Adicionar cartao</button>
    </form>
  );
}
