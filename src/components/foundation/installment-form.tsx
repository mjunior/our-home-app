import { useState } from "react";

interface Option {
  id: string;
  label: string;
}

interface InstallmentFormProps {
  accounts: Option[];
  cards: Option[];
  categories: Option[];
  onSubmit: (payload: {
    description: string;
    totalAmount: string;
    installmentsCount: number;
    startMonth: string;
    categoryId: string;
    accountId?: string;
    creditCardId?: string;
  }) => void;
}

export function InstallmentForm({ accounts, cards, categories, onSubmit }: InstallmentFormProps) {
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("0.00");
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [startMonth, setStartMonth] = useState("2026-04");
  const [target, setTarget] = useState<"account" | "card">("card");
  const [targetId, setTargetId] = useState(cards[0]?.id ?? accounts[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const targetOptions = target === "account" ? accounts : cards;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          description,
          totalAmount,
          installmentsCount,
          startMonth,
          categoryId,
          accountId: target === "account" ? targetId : undefined,
          creditCardId: target === "card" ? targetId : undefined,
        });
        setDescription("");
      }}
    >
      <h2>Nova compra parcelada</h2>
      <label>
        Descricao parcela
        <input aria-label="Descricao parcela" value={description} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <label>
        Valor total parcelado
        <input
          aria-label="Valor total parcelado"
          value={totalAmount}
          onChange={(event) => setTotalAmount(event.target.value)}
        />
      </label>
      <label>
        Quantidade parcelas
        <input
          aria-label="Quantidade parcelas"
          type="number"
          value={installmentsCount}
          onChange={(event) => setInstallmentsCount(Number(event.target.value))}
        />
      </label>
      <label>
        Mes inicial parcela
        <input aria-label="Mes inicial parcela" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} />
      </label>
      <label>
        Destino parcela
        <select
          aria-label="Destino parcela"
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
        Opcao destino parcela
        <select aria-label="Opcao destino parcela" value={targetId} onChange={(event) => setTargetId(event.target.value)}>
          {targetOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Categoria parcela
        <select aria-label="Categoria parcela" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Adicionar parcela</button>
    </form>
  );
}
