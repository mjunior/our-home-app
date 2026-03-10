import { useEffect, useState } from "react";

import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SimpleOption {
  id: string;
  label: string;
}

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear().toString().padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface TransactionFormValues {
  kind: "INCOME" | "EXPENSE";
  description: string;
  amount: string;
  occurredAt: string;
  accountId?: string;
  creditCardId?: string;
  categoryId: string;
  settlementStatus?: "PAID" | "UNPAID";
}

interface TransactionFormProps {
  accounts: SimpleOption[];
  cards: SimpleOption[];
  categories: SimpleOption[];
  onSubmit: (values: TransactionFormValues) => void;
  formId?: string;
  showSubmit?: boolean;
  title?: string;
  submitLabel?: string;
  resetKey?: number;
  initialValues?: Partial<{
    kind: "INCOME" | "EXPENSE";
    target: "account" | "card";
    targetId: string;
    description: string;
    amount: string;
    occurredAt: string;
    categoryId: string;
    settlementStatus: "PAID" | "UNPAID";
  }>;
  lockKind?: boolean;
  lockTarget?: boolean;
}

export function TransactionForm({
  accounts,
  cards,
  categories,
  onSubmit,
  formId = "transaction-form",
  showSubmit = true,
  title = "Novo Lancamento",
  submitLabel = "Adicionar lancamento",
  resetKey = 0,
  initialValues,
  lockKind = false,
  lockTarget = false,
}: TransactionFormProps) {
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">(initialValues?.kind ?? "INCOME");
  const [target, setTarget] = useState<"account" | "card">(initialValues?.target ?? "account");
  const [targetId, setTargetId] = useState<string>(initialValues?.targetId ?? accounts[0]?.id ?? cards[0]?.id ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [amount, setAmount] = useState(initialValues?.amount ?? "0,00");
  const [occurredDate, setOccurredDate] = useState(initialValues?.occurredAt ?? getTodayDateInputValue());
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? categories[0]?.id ?? "");
  const [settlementStatus, setSettlementStatus] = useState<"PAID" | "UNPAID">(initialValues?.settlementStatus ?? "PAID");

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

  useEffect(() => {
    setKind(initialValues?.kind ?? "INCOME");
    setTarget(initialValues?.target ?? "account");
    setTargetId(initialValues?.targetId ?? accounts[0]?.id ?? cards[0]?.id ?? "");
    setDescription(initialValues?.description ?? "");
    setAmount(initialValues?.amount ?? "0,00");
    setOccurredDate(initialValues?.occurredAt ?? getTodayDateInputValue());
    setCategoryId(initialValues?.categoryId ?? categories[0]?.id ?? "");
    setSettlementStatus(initialValues?.settlementStatus ?? "PAID");
  }, [resetKey, initialValues, accounts, cards, categories]);

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
              amount: currencyInputToDecimal(amount, { allowNegative: kind === "EXPENSE" }),
              occurredAt,
              categoryId,
              accountId: target === "account" ? targetId : undefined,
              creditCardId: target === "card" ? targetId : undefined,
              settlementStatus: target === "account" ? settlementStatus : undefined,
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
                disabled={lockKind}
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
              inputMode="decimal"
              value={amount}
              onChange={(event) =>
                setAmount(
                  formatCurrencyInputBRL(event.target.value, {
                    allowNegative: kind === "EXPENSE",
                  }),
                )
              }
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              Vincular em
              <select
                aria-label="Destino da transacao"
                value={target}
                disabled={lockTarget}
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
              <select aria-label="Opcao de destino" value={targetId} disabled={lockTarget} onChange={(event) => setTargetId(event.target.value)}>
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

          {target === "account" ? (
            <label>
              Status de quitacao
              <select
                aria-label="Status da transacao"
                value={settlementStatus}
                onChange={(event) => setSettlementStatus(event.target.value as "PAID" | "UNPAID")}
              >
                <option value="PAID">Pago/Recebido</option>
                <option value="UNPAID">Nao pago/nao recebido</option>
              </select>
            </label>
          ) : null}

          {showSubmit ? (
            <Button type="submit" className="w-full">
              {submitLabel}
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
