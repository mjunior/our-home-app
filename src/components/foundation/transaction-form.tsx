import { useEffect, useState } from "react";

import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

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
  formId?: string;
  showSubmit?: boolean;
}

export function TransactionForm({
  accounts,
  cards,
  categories,
  onSubmit,
  formId = "transaction-form",
  showSubmit = true,
}: TransactionFormProps) {
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [target, setTarget] = useState<"account" | "card">("account");
  const [targetId, setTargetId] = useState<string>(accounts[0]?.id ?? cards[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0,00");
  const [occurredDate, setOccurredDate] = useState("2026-03-01");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");

  const options = target === "account" ? accounts : cards;

  useEffect(() => {
    if (target === "account" && !accounts.find((item) => item.id === targetId)) {
      setTargetId(accounts[0]?.id ?? "");
    }

    if (target === "card" && !cards.find((item) => item.id === targetId)) {
      setTargetId(cards[0]?.id ?? "");
    }
  }, [target, targetId, accounts, cards]);

  useEffect(() => {
    if (!categories.find((item) => item.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? "");
    }
  }, [categoryId, categories]);

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>Novo Lancamento</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();

            const occurredAt = `${occurredDate}T12:00:00.000Z`;

            onSubmit({
              kind,
              description,
              amount: currencyInputToDecimal(amount),
              occurredAt,
              categoryId,
              accountId: target === "account" ? targetId : undefined,
              creditCardId: target === "card" ? targetId : undefined,
            });

            setDescription("");
          }}
          className="grid gap-3"
        >
          <div className="grid grid-cols-2 gap-3">
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
              Data
              <input
                aria-label="Data da transacao"
                type="date"
                value={occurredDate}
                onChange={(event) => setOccurredDate(event.target.value)}
              />
            </label>
          </div>

          <label>
            Descricao
            <input aria-label="Descricao da transacao" value={description} onChange={(event) => setDescription(event.target.value)} />
          </label>

          <label>
            Valor
            <input
              aria-label="Valor da transacao"
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(formatCurrencyInputBRL(event.target.value))}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

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

          {showSubmit ? (
            <Button type="submit" className="w-full">
              Adicionar lancamento
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
