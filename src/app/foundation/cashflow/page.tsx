import { useMemo, useState } from "react";

import { FreeBalanceAlert } from "../../../components/foundation/free-balance-alert";
import { FreeBalanceBreakdown } from "../../../components/foundation/free-balance-breakdown";
import { FreeBalanceCauses } from "../../../components/foundation/free-balance-causes";
import { FreeBalanceSemaphore } from "../../../components/foundation/free-balance-semaphore";
import { InvoicePanels } from "../../../components/foundation/invoice-panels";
import { StatementTable } from "../../../components/foundation/statement-table";
import { TransactionForm } from "../../../components/foundation/transaction-form";
import {
  accountsController,
  cardsController,
  categoriesController,
  freeBalanceController,
  invoicesController,
  transactionsController,
} from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function CashflowPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [month, setMonth] = useState("2026-03");
  const [accountFilter, setAccountFilter] = useState("");
  const [cardFilter, setCardFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");

  const accounts = useMemo(() => accountsController.listAccounts(HOUSEHOLD_ID), [refreshKey]);
  const cards = useMemo(() => cardsController.listCards(HOUSEHOLD_ID), [refreshKey]);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  const transactions = useMemo(
    () =>
      transactionsController.listTransactionsByMonth({
        householdId: HOUSEHOLD_ID,
        month,
        accountId: accountFilter || undefined,
        creditCardId: cardFilter || undefined,
        categoryId: categoryFilter || undefined,
      }),
    [refreshKey, month, accountFilter, cardFilter, categoryFilter],
  );

  const invoiceData = useMemo(() => {
    const cardId = selectedCardId || cards[0]?.id;
    if (!cardId) {
      return null;
    }

    return invoicesController.getCardInvoices({
      householdId: HOUSEHOLD_ID,
      cardId,
      referenceDate: `${month}-03T12:00:00.000Z`,
    });
  }, [cards, selectedCardId, refreshKey, month]);

  const freeBalance = useMemo(
    () =>
      freeBalanceController.getFreeBalance({
        householdId: HOUSEHOLD_ID,
        month,
      }),
    [month, refreshKey],
  );

  return (
    <main className="space-y-4">
      <h1>Fluxo de Caixa</h1>

      <FreeBalanceSemaphore
        freeBalanceCurrent={freeBalance.freeBalanceCurrent}
        freeBalanceNext={freeBalance.freeBalanceNext}
        additionalCardSpendCapacity={freeBalance.additionalCardSpendCapacity}
        risk={freeBalance.risk}
      />
      <FreeBalanceAlert alerts={freeBalance.alerts} confidence={freeBalance.confidence} missingData={freeBalance.missingData} />
      <FreeBalanceBreakdown current={freeBalance.breakdown.current} next={freeBalance.breakdown.next} />
      <FreeBalanceCauses topDrivers={freeBalance.topDrivers} />

      <TransactionForm
        accounts={accounts.map((item) => ({ id: item.id, label: item.name }))}
        cards={cards.map((item) => ({ id: item.id, label: item.name }))}
        categories={categories.map((item) => ({ id: item.id, label: item.name }))}
        onSubmit={(values) => {
          transactionsController.createTransaction({ householdId: HOUSEHOLD_ID, ...values });
          setRefreshKey((prev) => prev + 1);
        }}
      />

      <section className="panel">
        <h2>Filtros do extrato</h2>
        <div className="mt-3 grid gap-2">
        <label>
          Mes
          <input aria-label="Filtro mes" value={month} onChange={(event) => setMonth(event.target.value)} />
        </label>
        <label>
          Conta
          <select aria-label="Filtro conta" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}>
            <option value="">Todas</option>
            {accounts.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Cartao
          <select aria-label="Filtro cartao" value={cardFilter} onChange={(event) => setCardFilter(event.target.value)}>
            <option value="">Todos</option>
            {cards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Categoria
          <select
            aria-label="Filtro categoria"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        </div>
      </section>

      <section className="panel">
        <StatementTable entries={transactions} />
      </section>

      <section className="panel">
        <label>
          Cartao para fatura
          <select
            aria-label="Cartao da fatura"
            value={selectedCardId}
            onChange={(event) => setSelectedCardId(event.target.value)}
          >
            <option value="">Padrao</option>
            {cards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </section>

      <InvoicePanels data={invoiceData} />
    </main>
  );
}
