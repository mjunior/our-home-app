import { useMemo, useState } from "react";

import { FreeBalanceSemaphore } from "../../../components/foundation/free-balance-semaphore";
import { StatementTable } from "../../../components/foundation/statement-table";
import { TransactionForm } from "../../../components/foundation/transaction-form";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";
import { formatCurrencyBR } from "../../../lib/utils";
import {
  accountsController,
  cardsController,
  categoriesController,
  freeBalanceController,
  transactionsController,
} from "../runtime";

const HOUSEHOLD_ID = "household-main";

const breakdownLabels: Record<string, string> = {
  accountStartingBalance: "Saldo de contas",
  projectedIncome: "Entradas previstas",
  cardInvoiceDue: "Fatura de cartao",
  installments: "Parcelas",
  recurrences: "Recorrencias",
  oneOffExpenses: "Despesas avulsas",
  lateCarry: "Atrasos carregados",
};

export default function CashflowPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMonthKey, setDetailMonthKey] = useState<"current" | "next">("current");
  const { notify } = useSnackbar();
  const month = "2026-03";

  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const cards = useMemo(() => cardsController.listCards(HOUSEHOLD_ID), [refreshKey]);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  const accountLabels = useMemo(
    () => Object.fromEntries(accounts.map((item) => [item.id, item.name])),
    [accounts],
  );
  const cardLabels = useMemo(
    () => Object.fromEntries(cards.map((item) => [item.id, item.name])),
    [cards],
  );
  const categoryLabels = useMemo(
    () => Object.fromEntries(categories.map((item) => [item.id, item.name])),
    [categories],
  );

  const transactions = useMemo(
    () =>
      transactionsController.listTransactionsByMonth({
        householdId: HOUSEHOLD_ID,
        month,
      }),
    [refreshKey, month],
  );

  const freeBalance = useMemo(
    () =>
      freeBalanceController.getFreeBalance({
        householdId: HOUSEHOLD_ID,
        month,
      }),
    [month, refreshKey],
  );

  return (
    <main className="space-y-4 pb-28 lg:pb-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <div>
          <h1>Fluxo de Caixa</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Dashboard limpo com sinal de risco e extrato do mes.</p>
        </div>
        <Badge variant="lime">Dashboard</Badge>
      </section>

      <FreeBalanceSemaphore
        freeBalanceCurrent={freeBalance.freeBalanceCurrent}
        freeBalanceNext={freeBalance.freeBalanceNext}
        additionalCardSpendCapacity={freeBalance.additionalCardSpendCapacity}
        risk={freeBalance.risk}
        onOpenCurrentDetails={() => {
          setDetailMonthKey("current");
          setDetailModalOpen(true);
        }}
        onOpenNextDetails={() => {
          setDetailMonthKey("next");
          setDetailModalOpen(true);
        }}
      />

      <StatementTable
        entries={transactions}
        accountLabels={accountLabels}
        cardLabels={cardLabels}
        categoryLabels={categoryLabels}
      />

      <div className="fixed inset-x-0 bottom-[4.7rem] z-30 px-3 pb-2 lg:hidden">
        <Sheet open={transactionModalOpen} onOpenChange={setTransactionModalOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="lime" className="h-12 w-full text-sm">
              Novo lancamento
            </Button>
          </SheetTrigger>
          <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
            <SheetHeader>
              <SheetTitle>Adicionar lancamento</SheetTitle>
              <SheetDescription>Registre entrada ou saida sem sair do dashboard.</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <TransactionForm
                formId="cashflow-transaction-form"
                accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
                cards={cards.map((item) => ({ id: item.id, label: item.name }))}
                categories={categories.map((item) => ({ id: item.id, label: item.name }))}
                onSubmit={(values) => {
                  try {
                    transactionsController.createTransaction({ householdId: HOUSEHOLD_ID, ...values });
                    setRefreshKey((prev) => prev + 1);
                    setTransactionModalOpen(false);
                    notify({ message: "Lancamento cadastrado com sucesso.", tone: "success" });
                  } catch {
                    notify({ message: "Nao foi possivel cadastrar o lancamento.", tone: "error" });
                  }
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Sheet open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[85vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>
              Detalhamento do saldo livre - {detailMonthKey === "current" ? "Mes atual" : "Proximo mes"}
            </SheetTitle>
            <SheetDescription>Transparencia completa dos componentes usados no calculo.</SheetDescription>
          </SheetHeader>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">
                {detailMonthKey === "current"
                  ? `Mes atual (${freeBalance.breakdown.current.month})`
                  : `Proximo mes (${freeBalance.breakdown.next.month})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Object.entries(
                detailMonthKey === "current"
                  ? freeBalance.breakdown.current.components
                  : freeBalance.breakdown.next.components,
              ).map(([label, value]) => (
                <div key={label} className="row-animate flex items-center justify-between rounded-xl px-2 py-1.5 text-sm">
                  <span className="text-slate-500 dark:text-slate-300">{breakdownLabels[label] ?? label}</span>
                  <strong>{formatCurrencyBR(value)}</strong>
                </div>
              ))}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-sm dark:border-slate-700">
                <span>Saldo livre final</span>
                <strong>
                  {formatCurrencyBR(
                    detailMonthKey === "current" ? freeBalance.breakdown.current.freeBalance : freeBalance.breakdown.next.freeBalance,
                  )}
                </strong>
              </div>
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
    </main>
  );
}
