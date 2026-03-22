import React from "react";
import { CreditCard, Grid2X2, LayoutList, Target, Wallet } from "lucide-react";

import AccountsPage from "./foundation/accounts/page";
import CardsPage from "./foundation/cards/page";
import CashflowPage from "./foundation/cashflow/page";
import CategoriesPage from "./foundation/categories/page";
import SchedulesPage from "./foundation/schedules/page";
import GoalsPage from "./foundation/goals/page";

export type RouteKey = "cashflow" | "accounts" | "cards" | "categories" | "schedules" | "goals";

export interface RouteDef {
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  render: () => React.JSX.Element;
}

export const routes: Record<RouteKey, RouteDef> = {
  cashflow: { label: "Fluxo de Caixa", shortLabel: "Caixa", icon: <Wallet className="h-4 w-4" />, render: () => <CashflowPage /> },
  accounts: { label: "Contas", shortLabel: "Contas", icon: <LayoutList className="h-4 w-4" />, render: () => <AccountsPage /> },
  cards: { label: "Cartoes", shortLabel: "Cartoes", icon: <CreditCard className="h-4 w-4" />, render: () => <CardsPage /> },
  categories: { label: "Categorias", shortLabel: "Tags", icon: <Grid2X2 className="h-4 w-4" />, render: () => <CategoriesPage /> },
  schedules: { label: "Compromissos", shortLabel: "Comprom.", icon: <LayoutList className="h-4 w-4" />, render: () => <SchedulesPage /> },
  goals: { label: "Metas", shortLabel: "Metas", icon: <Target className="h-4 w-4" />, render: () => <GoalsPage /> },
};
