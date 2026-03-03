import { useState } from "react";

interface SimpleOption {
  id: string;
  label: string;
}

export interface TransactionFormValues {
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  occurredAt: string;
  accountId?: string;
  creditCardId?: string;
  categoryId: string;
}

interface TransactionFormProps {
  accounts: SimpleOption[];
  cards: SimpleOption[];
  categories: SimpleOption[];
  onSubmit: (values: TransactionFormValues) => void;
}

export function TransactionForm({ accounts, cards, categories, onSubmit }: TransactionFormProps) {
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [target, setTarget] = useState<"account" | "card">("account");
  const [targetId, setTargetId] = useState<string>(accounts[0]?.id ?? cards[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0.00");
  const [occurredDate, setOccurredDate] = useState("2026-03-01");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const options = target === "account" ? accounts : cards;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();

        const occurredAt = `${occurredDate}T12:00:00.000Z`;

        onSubmit({
          kind,
          description,
          amount,
          occurredAt,
          categoryId,
          accountId: target === "account" ? targetId : undefined,
          creditCardId: target === "card" ? targetId : undefined,
        });

        setDescription("");
      }}
    >
      <label>
        Tipo
        <select
          aria-label="Tipo da transacao"
          value={kind}
          onChange={(event) => setKind(event.target.value as "INCOME" | "EXPENSE")}
        >
          <option value="INCOME">Entrada</option>
          <option value="EXPENSE">Saida</option>
        </select>
      </label>

      <label>
        Descricao
        <input
          aria-label="Descricao da transacao"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <label>
        Valor
        <input aria-label="Valor da transacao" value={amount} onChange={(event) => setAmount(event.target.value)} />
      </label>

      <label>
        Data
        <input
          aria-label="Data da transacao"
          type="date"
          value={occurredDate}
          onChange={(event) => setOccurredDate(event.target.value)}
        />
      </label>

      <label>
        Vincular em
        <select
          aria-label="Destino da transacao"
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
        Opcao de destino
        <select aria-label="Opcao de destino" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Categoria
        <select aria-label="Categoria da transacao" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {categories.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <button type="submit">Adicionar lancamento</button>
    </form>
  );
}
