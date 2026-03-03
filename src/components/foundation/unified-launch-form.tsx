import { useMemo, useState } from "react";

import { currencyInputToDecimal, formatCurrencyInputBRL } from "../../lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

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
  onSubmit: (payload: UnifiedLaunchPayload) => void;
  formId?: string;
  showSubmit?: boolean;
}

export function UnifiedLaunchForm({
  householdId,
  accounts,
  cards,
  categories,
  onSubmit,
  formId = "unified-launch-form",
  showSubmit = true,
}: UnifiedLaunchFormProps) {
  const [launchType, setLaunchType] = useState<"ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT">("ONE_OFF");
  const [kind, setKind] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [target, setTarget] = useState<"account" | "card">("account");
  const [targetId, setTargetId] = useState<string>(accounts[0]?.id ?? cards[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("0,00");
  const [occurredDate, setOccurredDate] = useState("2026-03-01");
  const [startMonth, setStartMonth] = useState("2026-03");
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const checkingAccounts = useMemo(() => accounts.filter((item) => item.type === "CHECKING"), [accounts]);
  const investmentAccounts = useMemo(() => accounts.filter((item) => item.type === "INVESTMENT"), [accounts]);
  const [investmentSourceId, setInvestmentSourceId] = useState(checkingAccounts[0]?.id ?? "");
  const [investmentDestinationId, setInvestmentDestinationId] = useState(investmentAccounts[0]?.id ?? "");

  const options = target === "account" ? accounts : cards;
  const resolvedCategoryId = categoryId || categories[0]?.id || "";

  const title = useMemo(() => {
    if (launchType === "RECURRING") return "Nova recorrencia";
    if (launchType === "INSTALLMENT") return "Novo parcelamento";
    if (launchType === "INVESTMENT") return "Novo investimento";
    return "Novo Lancamento";
  }, [launchType]);

  return (
    <Card className="section-reveal">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={launchType} onValueChange={(value) => setLaunchType(value as "ONE_OFF" | "RECURRING" | "INSTALLMENT" | "INVESTMENT")}>
          <TabsList className="mb-3 grid h-12 w-full grid-cols-4">
            <TabsTrigger value="ONE_OFF">Avulso</TabsTrigger>
            <TabsTrigger value="RECURRING">Recorrencia</TabsTrigger>
            <TabsTrigger value="INSTALLMENT">Parcelamento</TabsTrigger>
            <TabsTrigger value="INVESTMENT">Investimento</TabsTrigger>
          </TabsList>
        </Tabs>

        <form
          id={formId}
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();

            if (launchType === "INVESTMENT") {
              onSubmit({
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
              onSubmit({
                launchType: "ONE_OFF",
                transaction: {
                  householdId,
                  kind,
                  description,
                  amount: currencyInputToDecimal(amount),
                  occurredAt: `${occurredDate}T12:00:00.000Z`,
                  categoryId: resolvedCategoryId,
                  accountId,
                  creditCardId,
                },
              });
            } else if (launchType === "RECURRING") {
              onSubmit({
                launchType: "RECURRING",
                recurring: {
                  householdId,
                  kind,
                  description,
                  amount: currencyInputToDecimal(amount),
                  startMonth,
                  categoryId: resolvedCategoryId,
                  accountId,
                  creditCardId,
                },
              });
            } else {
              onSubmit({
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
          }}
        >
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
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(formatCurrencyInputBRL(event.target.value))}
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
            <Button type="submit" className="w-full">
              Adicionar lancamento
            </Button>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
