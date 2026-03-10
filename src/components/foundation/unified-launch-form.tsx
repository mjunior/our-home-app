import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

function getTodayDateInputValue() {
  const now = new Date();
  const year = now.getFullYear().toString().padStart(4, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface AccountOption {
  id: string;
  label: string;
  type: "CHECKING" | "INVESTMENT";
}

interface SimpleOption {
  id: string;
  label: string;
}

export type UnifiedLaunchPayload =
  | {
      launchType: "ONE_OFF";
      transaction: {
        householdId: string;
        kind: "INCOME" | "EXPENSE";
        description: string;
        amount: string;
        occurredAt: string;
        categoryId: string;
        accountId?: string;
        creditCardId?: string;
        settlementStatus?: "PAID" | "UNPAID";
      };
    }
  | {
      launchType: "RECURRING";
      recurring: {
        householdId: string;
        kind: "INCOME" | "EXPENSE";
        description: string;
        amount: string;
        startMonth: string;
        categoryId: string;
        accountId?: string;
        creditCardId?: string;
      };
    }
  | {
      launchType: "INSTALLMENT";
      installment: {
        householdId: string;
        description: string;
        totalAmount: string;
        installmentsCount: number;
        startMonth: string;
        categoryId: string;
        accountId?: string;
        creditCardId?: string;
      };
    }
  | {
      launchType: "INVESTMENT";
      investment: {
        householdId: string;
        description: string;
        amount: string;
        occurredAt: string;
        categoryId: string;
        sourceAccountId: string;
        destinationAccountId: string;
      };
    };

interface UnifiedLaunchFormProps {
  householdId: string;
  accounts: AccountOption[];
  cards: SimpleOption[];
  categories: SimpleOption[];
  onSubmit: (payload: UnifiedLaunchPayload) => Promise<void> | void;
  formId?: string;
  showSubmit?: boolean;
  resetKey?: number;
}

export function UnifiedLaunchForm({
  householdId,
  accounts,
  cards,
  categories,
  onSubmit,
  formId = "unified-launch-form",
  showSubmit = true,
  resetKey = 0,
}: UnifiedLaunchFormProps) {
  const defaultToday = getTodayDateInputValue();
  const [launchType, setLaunchType] = useState<"ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT">("ONE_OFF");
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [target, setTarget] = useState<"account" | "card">("account");
  const [targetId, setTargetId] = useState<string>(accounts[0]?.id ?? cards[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0,00");
  const [occurredDate, setOccurredDate] = useState(defaultToday);
  const [startMonth, setStartMonth] = useState(defaultToday.slice(0, 7));
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [settlementStatus, setSettlementStatus] = useState<"PAID" | "UNPAID">("PAID");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const checkingAccounts = useMemo(() => accounts.filter((item) => item.type === "CHECKING"), [accounts]);
  const investmentAccounts = useMemo(() => accounts.filter((item) => item.type === "INVESTMENT"), [accounts]);
  const [investmentSourceId, setInvestmentSourceId] = useState(checkingAccounts[0]?.id ?? "");
  const [investmentDestinationId, setInvestmentDestinationId] = useState(investmentAccounts[0]?.id ?? "");

  const options = target === "account" ? accounts : cards;
  const resolvedCategoryId = categoryId || categories[0]?.id || "";

  useEffect(() => {
    const today = getTodayDateInputValue();
    setLaunchType("ONE_OFF");
    setKind("INCOME");
    setTarget("account");
    setTargetId(accounts[0]?.id ?? cards[0]?.id ?? "");
    setDescription("");
    setAmount("0,00");
    setOccurredDate(today);
    setStartMonth(today.slice(0, 7));
    setInstallmentsCount(2);
    setCategoryId(categories[0]?.id ?? "");
    setSettlementStatus("PAID");
    setInvestmentSourceId(checkingAccounts[0]?.id ?? "");
    setInvestmentDestinationId(investmentAccounts[0]?.id ?? "");
    setIsSubmitting(false);
  }, [resetKey, accounts, cards, categories, checkingAccounts, investmentAccounts]);

  const title = useMemo(() => {
    if (launchType === "RECURRING") return "Nova recorrencia";
    if (launchType === "INSTALLMENT") return "Novo parcelamento";
    if (launchType === "INVESTMENT") return "Novo investimento";
    return "Novo Lancamento";
  }, [launchType]);
  const submitLabel = isSubmitting ? "Salvando..." : "Adicionar lancamento";

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={launchType} onValueChange={(value) => setLaunchType(value as "ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT")}>
          <TabsList className="mb-3 grid h-12 w-full grid-cols-4">
            <TabsTrigger value="ONE_OFF" disabled={isSubmitting}>Avulso</TabsTrigger>
            <TabsTrigger value="RECURRING" disabled={isSubmitting}>Recorrencia</TabsTrigger>
            <TabsTrigger value="INSTALLMENT" disabled={isSubmitting}>Parcelamento</TabsTrigger>
            <TabsTrigger value="INVESTMENT" disabled={isSubmitting}>Investimento</TabsTrigger>
          </TabsList>
        </Tabs>

        <form
          id={formId}
          className="grid gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (isSubmitting) {
              return;
            }

            setIsSubmitting(true);

            try {
              if (launchType === "INVESTMENT") {
                await onSubmit({
                  launchType: "INVESTMENT",
                  investment: {
                    householdId,
                    description,
                    amount: currencyInputToDecimal(amount),
                    occurredAt: `${occurredDate}T12:00:00.000Z`,
                    categoryId: resolvedCategoryId,
                    sourceAccountId: investmentSourceId,
                    destinationAccountId: investmentDestinationId,
                  },
                });
                setDescription("");
                return;
              }

              const accountId = target === "account" ? targetId : undefined;
              const creditCardId = target === "card" ? targetId : undefined;

              if (launchType === "ONE_OFF") {
                await onSubmit({
                  launchType: "ONE_OFF",
                  transaction: {
                    householdId,
                    kind,
                    description,
                    amount: currencyInputToDecimal(amount, { allowNegative: kind === "EXPENSE" }),
                    occurredAt: `${occurredDate}T12:00:00.000Z`,
                    categoryId: resolvedCategoryId,
                    accountId,
                    creditCardId,
                    settlementStatus: accountId ? settlementStatus : undefined,
                  },
                });
              } else if (launchType === "RECURRING") {
                await onSubmit({
                  launchType: "RECURRING",
                  recurring: {
                    householdId,
                    kind,
                    description,
                    amount: currencyInputToDecimal(amount, { allowNegative: kind === "EXPENSE" }),
                    startMonth,
                    categoryId: resolvedCategoryId,
                    accountId,
                    creditCardId,
                  },
                });
              } else {
                await onSubmit({
                  launchType: "INSTALLMENT",
                  installment: {
                    householdId,
                    description,
                    totalAmount: currencyInputToDecimal(amount),
                    installmentsCount,
                    startMonth,
                    categoryId: resolvedCategoryId,
                    accountId,
                    creditCardId,
                  },
                });
              }

              setDescription("");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <fieldset className="grid gap-3 disabled:cursor-wait disabled:opacity-85" disabled={isSubmitting}>
            {launchType === "INVESTMENT" ? (
              <label>
                Data da transacao
                <input
                  aria-label="Data da transacao"
                  type="date"
                  value={occurredDate}
                  onChange={(event) => setOccurredDate(event.target.value)}
                />
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label>
                  Tipo da transacao
                  <select aria-label="Tipo da transacao" value={kind} onChange={(event) => setKind(event.target.value as "INCOME" | "EXPENSE")}>
                    <option value="INCOME">Entrada</option>
                    <option value="EXPENSE">Saida</option>
                  </select>
                </label>

                {launchType === "ONE_OFF" ? (
                  <label>
                    Data da transacao
                    <input
                      aria-label="Data da transacao"
                      type="date"
                      value={occurredDate}
                      onChange={(event) => setOccurredDate(event.target.value)}
                    />
                  </label>
                ) : (
                  <label>
                    Mes inicial
                    <input aria-label="Mes inicial" value={startMonth} onChange={(event) => setStartMonth(event.target.value)} />
                  </label>
                )}
              </div>
            )}

            <label>
              Descricao da transacao
              <input aria-label="Descricao da transacao" value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>

            <label>
              {launchType === "INSTALLMENT" ? "Valor total parcelado" : "Valor da transacao"}
              <input
                aria-label={launchType === "INSTALLMENT" ? "Valor total parcelado" : "Valor da transacao"}
                inputMode="decimal"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    formatCurrencyInputBRL(event.target.value, {
                      allowNegative: launchType !== "INSTALLMENT" && launchType !== "INVESTMENT" && kind === "EXPENSE",
                    }),
                  )
                }
              />
            </label>

            {launchType === "INSTALLMENT" ? (
              <label>
                Quantidade parcelas
                <input
                  aria-label="Quantidade parcelas"
                  type="number"
                  min={2}
                  value={installmentsCount}
                  onChange={(event) => setInstallmentsCount(Number(event.target.value))}
                />
              </label>
            ) : null}

            {launchType === "INVESTMENT" ? (
              <div className="grid grid-cols-2 gap-3">
                <label>
                  Conta de origem
                  <select
                    aria-label="Conta de origem"
                    value={investmentSourceId}
                    onChange={(event) => setInvestmentSourceId(event.target.value)}
                  >
                    {checkingAccounts.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Conta de destino
                  <select
                    aria-label="Conta de destino"
                    value={investmentDestinationId}
                    onChange={(event) => setInvestmentDestinationId(event.target.value)}
                  >
                    {investmentAccounts.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label>
                  Destino da transacao
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
            )}

            {launchType === "ONE_OFF" && target === "account" ? (
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

            <label>
              Categoria da transacao
              <select aria-label="Categoria da transacao" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">Sem categoria</option>
                {categories.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {showSubmit ? (
              <Button type="submit" className="w-full disabled:cursor-wait" disabled={isSubmitting} aria-busy={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {submitLabel}
              </Button>
            ) : null}
          </fieldset>
        </form>
      </CardContent>
    </Card>
  );
}
