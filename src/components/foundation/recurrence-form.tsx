import { useState } from "react";

interface Option {
  id: string;
  label: string;
}

interface RecurrenceFormProps {
  accounts: Option[];
  cards: Option[];
  categories: Option[];
  onSubmit: (payload: {
    kind: "INCOME" | "EXPENSE";
    description: string;
    amount: string;
    startMonth: string;
    categoryId: string;
    accountId?: string;
    creditCardId?: string;
  }) => void;
}

export function RecurrenceForm({ accounts, cards, categories, onSubmit }: RecurrenceFormProps) {
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [startMonth, setStartMonth] = useState("2026-03");
  const [target, setTarget] = useState<"account" | "card">("account");
  const [targetId, setTargetId] = useState(accounts[0]?.id ?? cards[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const targetOptions = target === "account" ? accounts : cards;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          kind,
          description,
          amount,
          startMonth,
          categoryId,
          accountId: target === "account" ? targetId : undefined,
          creditCardId: target === "card" ? targetId : undefined,
        });
        setDescription("");
      }}
    >
      <h2>Nova recorrencia</h2>
      <label>
        Tipo recorrencia
        <select aria-label="Tipo recorrencia" value={kind} onChange={(event) => setKind(event.target.value as any)}>
          <option value="INCOME">Entrada</option>
          <option value="EXPENSE">Saida</option>
        </select>
      </label>
      <label>
        Descricao recorrencia
        <input
          aria-label="Descricao recorrencia"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <label>
        Valor recorrencia
        <input aria-label="Valor recorrencia" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>
      <label>
        Mes inicial recorrencia
        <input
          aria-label="Mes inicial recorrencia"
          value={startMonth}
          onChange={(event) => setStartMonth(event.target.value)}
        />
      </label>
      <label>
        Destino recorrencia
        <select
          aria-label="Destino recorrencia"
          value={target}
          onChange={(event) => {
            const value = event.target.value as "account" | "card";
            setTarget(value);
            const fallback = (value === "account" ? accounts[0]?.id : cards[0]?.id) ?? "";
            setTargetId(fallback);
          }}
        >
          <option value="account">Conta</option>
          <option value="card">Cartao</option>
        </select>
      </label>
      <label>
        Opcao destino recorrencia
        <select aria-label="Opcao destino recorrencia" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {targetOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Categoria recorrencia
        <select
          aria-label="Categoria recorrencia"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Adicionar recorrencia</button>
    </form>
  );
}
