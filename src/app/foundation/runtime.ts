import { AccountsController } from "../../modules/accounts/accounts.controller";
import { AccountsRepository } from "../../modules/accounts/accounts.repository";
import { AccountsService } from "../../modules/accounts/accounts.service";
import { CardsController } from "../../modules/cards/cards.controller";
import { CardsRepository } from "../../modules/cards/cards.repository";
import { CardsService } from "../../modules/cards/cards.service";
import { CategoriesController } from "../../modules/categories/categories.controller";
import { CategoriesRepository } from "../../modules/categories/categories.repository";
import { CategoriesService } from "../../modules/categories/categories.service";
import { FreeBalanceController } from "../../modules/free-balance/free-balance.controller";
import { FreeBalancePolicy } from "../../modules/free-balance/free-balance.policy";
import { FreeBalanceService } from "../../modules/free-balance/free-balance.service";
import { InvoiceCycleService } from "../../modules/invoices/invoice-cycle.service";
import { InvoicesController } from "../../modules/invoices/invoices.controller";
import { InvoiceSettlementRepository } from "../../modules/invoices/invoice-settlement.repository";
import { InvoicesService } from "../../modules/invoices/invoices.service";
import { InstallmentsService } from "../../modules/scheduling/installments.service";
import { RecurrenceService } from "../../modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../modules/scheduling/schedule-engine.service";
import { ScheduleManagementController } from "../../modules/scheduling/schedule-management.controller";
import { ScheduleManagementService, type RecurringEditScope } from "../../modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../modules/scheduling/schedule.repository";
import { TransactionsController } from "../../modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../modules/transactions/transactions.repository";
import { TransactionsService } from "../../modules/transactions/transactions.service";

type MethodArgs<T> = T extends (...args: infer A) => unknown ? A : never;
type MethodReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type AccountsControllerContract = Pick<AccountsController, "createAccount" | "updateAccountGoal" | "listAccounts" | "getConsolidatedBalance">;
type CardsControllerContract = Pick<CardsController, "createCard" | "listCards" | "updateCard" | "deleteCard">;
type CategoriesControllerContract = Pick<CategoriesController, "createCategory" | "listCategories">;
type TransactionsControllerContract = Pick<
  TransactionsController,
  | "createTransaction"
  | "createInvestmentTransfer"
  | "updateTransaction"
  | "updateInvestmentTransfer"
  | "deleteTransaction"
  | "deleteInvestmentTransfer"
  | "listTransactionsByMonth"
>;
type InvoicesControllerContract = Pick<
  InvoicesController,
  | "getCardInvoices"
  | "getMonthlyCashflowSummary"
  | "getMonthlyInvoices"
  | "getDueObligationsByMonth"
  | "getCardInvoiceEntriesByDueMonth"
  | "settleInvoice"
  | "unsettleInvoice"
>;
type FreeBalanceControllerContract = Pick<FreeBalanceController, "getFreeBalance">;
type ScheduleManagementControllerContract = Pick<
  ScheduleManagementController,
  | "createRecurringSchedule"
  | "createInstallmentSchedule"
  | "createLaunch"
  | "createLaunchBatch"
  | "listSchedules"
  | "listMonthInstances"
  | "updateInstanceSettlement"
  | "editRecurringSchedule"
  | "editInstallmentSchedule"
  | "deleteRecurringSchedule"
  | "deleteInstallmentSchedule"
  | "stopRecurringSchedule"
>;
type Runtime = {
  accountsController: AccountsControllerContract;
  cardsController: CardsControllerContract;
  categoriesController: CategoriesControllerContract;
  transactionsController: TransactionsControllerContract;
  invoicesController: InvoicesControllerContract;
  freeBalanceController: FreeBalanceControllerContract;
  scheduleManagementController: ScheduleManagementControllerContract;
};

export interface SessionUser {
  userId: string;
  email: string;
  householdId: string;
}

let activeSessionUser: SessionUser | null = null;

function resolveHouseholdId(fallback?: string) {
  return activeSessionUser?.householdId ?? fallback ?? "household-main";
}

function handleUnauthorized() {
  activeSessionUser = null;
  if (import.meta.env.MODE === "test") {
    return;
  }
  if (typeof window !== "undefined" && window.location.pathname !== "/") {
    window.location.assign("/");
  }
}

function requestSync<T>(method: "GET" | "POST", url: string, payload?: unknown): T {
  const request = new XMLHttpRequest();
  request.open(method, url, false);
  request.setRequestHeader("Content-Type", "application/json");

  request.send(payload ? JSON.stringify(payload) : null);

  if (request.status >= 400 || request.status === 0) {
    if (request.status === 401) {
      handleUnauthorized();
    }
    let message = `HTTP_${request.status}`;
    try {
      const parsed = JSON.parse(request.responseText) as { message?: string };
      message = parsed.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return JSON.parse(request.responseText) as T;
}

function createLocalRuntime(): Runtime {
  const accountsRepository = new AccountsRepository();
  const cardsRepository = new CardsRepository();
  const categoriesRepository = new CategoriesRepository();
  const transactionsRepository = new TransactionsRepository();
  const scheduleRepository = new ScheduleRepository();
  const invoiceSettlementRepository = new InvoiceSettlementRepository();
  const scheduleEngine = new ScheduleEngineService();

  const accountsController = new AccountsController(
    new AccountsService(accountsRepository, transactionsRepository, invoiceSettlementRepository, scheduleRepository),
  );
  const cardsModuleController = new CardsController(new CardsService(cardsRepository));
  const categoriesController = new CategoriesController(new CategoriesService(categoriesRepository));
  const transactionsController = new TransactionsController(
    new TransactionsService(transactionsRepository, accountsRepository, cardsRepository, categoriesRepository),
  );
  const invoicesController = new InvoicesController(
    new InvoicesService(
      transactionsRepository,
      cardsRepository,
      new InvoiceCycleService(),
      scheduleRepository,
      invoiceSettlementRepository,
    ),
  );
  const freeBalanceController = new FreeBalanceController(
    new FreeBalanceService(
      accountsRepository,
      cardsRepository,
      transactionsRepository,
      scheduleRepository,
      new InvoiceCycleService(),
      new FreeBalancePolicy(),
    ),
  );
  const scheduleManagementController = new ScheduleManagementController(
    new ScheduleManagementService(
      scheduleRepository,
      new InstallmentsService(scheduleRepository, scheduleEngine),
      new RecurrenceService(scheduleRepository, scheduleEngine),
      scheduleEngine,
      new TransactionsService(transactionsRepository, accountsRepository, cardsRepository, categoriesRepository),
    ),
  );

  return {
    accountsController,
    cardsController: {
      createCard: (input) => cardsModuleController.createCard(input),
      listCards: (householdId) => cardsModuleController.listCards(householdId),
      updateCard: (input) => cardsModuleController.updateCard(input),
      deleteCard: (input) => {
        const card = cardsRepository.findById(input.id);
        if (!card || card.householdId !== input.householdId) {
          throw new Error("CARD_NOT_FOUND");
        }

        transactionsRepository.removeByCreditCardId(input.householdId, input.id);
        scheduleRepository.removeByCreditCardId(input.householdId, input.id);
        invoiceSettlementRepository.removeByCard({ householdId: input.householdId, cardId: input.id });
        return cardsModuleController.deleteCard(input);
      },
    },
    categoriesController,
    transactionsController,
    invoicesController,
    freeBalanceController,
    scheduleManagementController,
  };
}

function createApiRuntime(): Runtime {
  type AccountsCreateInput = MethodArgs<Runtime["accountsController"]["createAccount"]>[0];
  type AccountsCreateOutput = MethodReturn<Runtime["accountsController"]["createAccount"]>;
  type AccountsUpdateGoalInput = MethodArgs<Runtime["accountsController"]["updateAccountGoal"]>[0];
  type AccountsUpdateGoalOutput = MethodReturn<Runtime["accountsController"]["updateAccountGoal"]>;
  type AccountsListOutput = MethodReturn<Runtime["accountsController"]["listAccounts"]>;
  type AccountsConsolidatedOutput = MethodReturn<Runtime["accountsController"]["getConsolidatedBalance"]>;

  type CardsCreateInput = MethodArgs<Runtime["cardsController"]["createCard"]>[0];
  type CardsCreateOutput = MethodReturn<Runtime["cardsController"]["createCard"]>;
  type CardsUpdateInput = MethodArgs<Runtime["cardsController"]["updateCard"]>[0];
  type CardsUpdateOutput = MethodReturn<Runtime["cardsController"]["updateCard"]>;
  type CardsDeleteInput = MethodArgs<Runtime["cardsController"]["deleteCard"]>[0];
  type CardsDeleteOutput = MethodReturn<Runtime["cardsController"]["deleteCard"]>;
  type CardsListOutput = MethodReturn<Runtime["cardsController"]["listCards"]>;

  type CategoriesCreateInput = MethodArgs<Runtime["categoriesController"]["createCategory"]>[0];
  type CategoriesCreateOutput = MethodReturn<Runtime["categoriesController"]["createCategory"]>;
  type CategoriesListOutput = MethodReturn<Runtime["categoriesController"]["listCategories"]>;

  type TransactionsCreateInput = MethodArgs<Runtime["transactionsController"]["createTransaction"]>[0];
  type TransactionsCreateOutput = MethodReturn<Runtime["transactionsController"]["createTransaction"]>;
  type TransactionsUpdateInput = MethodArgs<Runtime["transactionsController"]["updateTransaction"]>[0];
  type TransactionsUpdateOutput = MethodReturn<Runtime["transactionsController"]["updateTransaction"]>;
  type TransactionsInvestmentCreateInput = MethodArgs<Runtime["transactionsController"]["createInvestmentTransfer"]>[0];
  type TransactionsInvestmentCreateOutput = MethodReturn<Runtime["transactionsController"]["createInvestmentTransfer"]>;
  type TransactionsInvestmentUpdateInput = MethodArgs<Runtime["transactionsController"]["updateInvestmentTransfer"]>[0];
  type TransactionsInvestmentUpdateOutput = MethodReturn<Runtime["transactionsController"]["updateInvestmentTransfer"]>;
  type TransactionsDeleteInput = MethodArgs<Runtime["transactionsController"]["deleteTransaction"]>[0];
  type TransactionsDeleteOutput = MethodReturn<Runtime["transactionsController"]["deleteTransaction"]>;
  type TransactionsInvestmentDeleteInput = MethodArgs<Runtime["transactionsController"]["deleteInvestmentTransfer"]>[0];
  type TransactionsInvestmentDeleteOutput = MethodReturn<Runtime["transactionsController"]["deleteInvestmentTransfer"]>;
  type TransactionsListInput = MethodArgs<Runtime["transactionsController"]["listTransactionsByMonth"]>[0];
  type TransactionsListOutput = MethodReturn<Runtime["transactionsController"]["listTransactionsByMonth"]>;

  type CardInvoicesInput = MethodArgs<Runtime["invoicesController"]["getCardInvoices"]>[0];
  type CardInvoicesOutput = MethodReturn<Runtime["invoicesController"]["getCardInvoices"]>;
  type MonthlyInvoicesInput = MethodArgs<Runtime["invoicesController"]["getMonthlyInvoices"]>[0];
  type MonthlyInvoicesOutput = MethodReturn<Runtime["invoicesController"]["getMonthlyInvoices"]>;
  type DueObligationsInput = MethodArgs<Runtime["invoicesController"]["getDueObligationsByMonth"]>[0];
  type DueObligationsOutput = MethodReturn<Runtime["invoicesController"]["getDueObligationsByMonth"]>;
  type CardInvoiceEntriesInput = MethodArgs<Runtime["invoicesController"]["getCardInvoiceEntriesByDueMonth"]>[0];
  type CardInvoiceEntriesOutput = MethodReturn<Runtime["invoicesController"]["getCardInvoiceEntriesByDueMonth"]>;
  type SettleInvoiceInput = MethodArgs<Runtime["invoicesController"]["settleInvoice"]>[0];
  type SettleInvoiceOutput = MethodReturn<Runtime["invoicesController"]["settleInvoice"]>;
  type UnsettleInvoiceInput = MethodArgs<Runtime["invoicesController"]["unsettleInvoice"]>[0];
  type UnsettleInvoiceOutput = MethodReturn<Runtime["invoicesController"]["unsettleInvoice"]>;

  type FreeBalanceInput = MethodArgs<Runtime["freeBalanceController"]["getFreeBalance"]>[0];
  type FreeBalanceOutput = MethodReturn<Runtime["freeBalanceController"]["getFreeBalance"]>;

  type RecurringCreateInput = MethodArgs<Runtime["scheduleManagementController"]["createRecurringSchedule"]>[0];
  type RecurringCreateOutput = MethodReturn<Runtime["scheduleManagementController"]["createRecurringSchedule"]>;
  type InstallmentCreateInput = MethodArgs<Runtime["scheduleManagementController"]["createInstallmentSchedule"]>[0];
  type InstallmentCreateOutput = MethodReturn<Runtime["scheduleManagementController"]["createInstallmentSchedule"]>;
  type UnifiedLaunchInput = MethodArgs<Runtime["scheduleManagementController"]["createLaunch"]>[0];
  type UnifiedLaunchOutput = MethodReturn<Runtime["scheduleManagementController"]["createLaunch"]>;
  type UnifiedLaunchBatchInput = MethodArgs<Runtime["scheduleManagementController"]["createLaunchBatch"]>[0];
  type UnifiedLaunchBatchOutput = MethodReturn<Runtime["scheduleManagementController"]["createLaunchBatch"]>;
  type SchedulesListOutput = MethodReturn<Runtime["scheduleManagementController"]["listSchedules"]>;
  type SchedulesMonthInstancesInput = MethodArgs<Runtime["scheduleManagementController"]["listMonthInstances"]>[0];
  type SchedulesMonthInstancesOutput = MethodReturn<Runtime["scheduleManagementController"]["listMonthInstances"]>;
  type SchedulesInstanceSettlementInput = MethodArgs<Runtime["scheduleManagementController"]["updateInstanceSettlement"]>[0];
  type SchedulesInstanceSettlementOutput = MethodReturn<Runtime["scheduleManagementController"]["updateInstanceSettlement"]>;
  type RecurringEditInput = MethodArgs<Runtime["scheduleManagementController"]["editRecurringSchedule"]>[0];
  type RecurringEditOutput = MethodReturn<Runtime["scheduleManagementController"]["editRecurringSchedule"]>;
  type InstallmentEditInput = MethodArgs<Runtime["scheduleManagementController"]["editInstallmentSchedule"]>[0];
  type InstallmentEditOutput = MethodReturn<Runtime["scheduleManagementController"]["editInstallmentSchedule"]>;
  type RecurringDeleteInput = MethodArgs<Runtime["scheduleManagementController"]["deleteRecurringSchedule"]>[0];
  type RecurringDeleteOutput = MethodReturn<Runtime["scheduleManagementController"]["deleteRecurringSchedule"]>;
  type InstallmentDeleteInput = MethodArgs<Runtime["scheduleManagementController"]["deleteInstallmentSchedule"]>[0];
  type InstallmentDeleteOutput = MethodReturn<Runtime["scheduleManagementController"]["deleteInstallmentSchedule"]>;
  type RecurringStopInput = MethodArgs<Runtime["scheduleManagementController"]["stopRecurringSchedule"]>[0];
  type RecurringStopOutput = MethodReturn<Runtime["scheduleManagementController"]["stopRecurringSchedule"]>;

  return {
    accountsController: {
      createAccount: (input: AccountsCreateInput): AccountsCreateOutput =>
        requestSync<AccountsCreateOutput>("POST", "/api/accounts", {
          name: input.name,
          type: input.type,
          openingBalance: input.openingBalance,
          goalAmount: input.goalAmount ?? null,
        }),
      updateAccountGoal: (input: AccountsUpdateGoalInput): AccountsUpdateGoalOutput =>
        requestSync<AccountsUpdateGoalOutput>("POST", "/api/accounts/edit", {
          id: input.id,
          goalAmount: input.goalAmount,
        }),
      listAccounts: (_householdId: string): AccountsListOutput =>
        requestSync<AccountsListOutput>("GET", "/api/accounts"),
      getConsolidatedBalance: (_householdId: string): AccountsConsolidatedOutput =>
        requestSync<AccountsConsolidatedOutput>("GET", "/api/accounts/consolidated"),
    },
    cardsController: {
      createCard: (input: CardsCreateInput): CardsCreateOutput =>
        requestSync<CardsCreateOutput>("POST", "/api/cards", {
          name: input.name,
          closeDay: input.closeDay,
          dueDay: input.dueDay,
        }),
      updateCard: (input: CardsUpdateInput): CardsUpdateOutput =>
        requestSync<CardsUpdateOutput>("POST", "/api/cards/edit", {
          id: input.id,
          name: input.name,
          closeDay: input.closeDay,
          dueDay: input.dueDay,
        }),
      deleteCard: (input: CardsDeleteInput): CardsDeleteOutput =>
        requestSync<CardsDeleteOutput>("POST", "/api/cards/delete", {
          id: input.id,
        }),
      listCards: (_householdId: string): CardsListOutput =>
        requestSync<CardsListOutput>("GET", "/api/cards"),
    },
    categoriesController: {
      createCategory: (input: CategoriesCreateInput): CategoriesCreateOutput =>
        requestSync<CategoriesCreateOutput>("POST", "/api/categories", { name: input.name }),
      listCategories: (_householdId: string): CategoriesListOutput =>
        requestSync<CategoriesListOutput>("GET", "/api/categories"),
    },
    transactionsController: {
      createTransaction: (input: TransactionsCreateInput): TransactionsCreateOutput =>
        requestSync<TransactionsCreateOutput>("POST", "/api/transactions", {
          kind: input.kind,
          description: input.description,
          amount: input.amount,
          occurredAt: input.occurredAt,
          accountId: input.accountId,
          creditCardId: input.creditCardId,
          categoryId: input.categoryId,
          settlementStatus: input.settlementStatus,
        }),
      createInvestmentTransfer: (input: TransactionsInvestmentCreateInput): TransactionsInvestmentCreateOutput =>
        requestSync<TransactionsInvestmentCreateOutput>("POST", "/api/transactions/investments", {
          description: input.description,
          amount: input.amount,
          occurredAt: input.occurredAt,
          categoryId: input.categoryId,
          sourceAccountId: input.sourceAccountId,
          destinationAccountId: input.destinationAccountId,
        }),
      updateTransaction: (input: TransactionsUpdateInput): TransactionsUpdateOutput =>
        requestSync<TransactionsUpdateOutput>("POST", "/api/transactions/edit", {
          id: input.id,
          kind: input.kind,
          description: input.description,
          amount: input.amount,
          occurredAt: input.occurredAt,
          accountId: input.accountId,
          creditCardId: input.creditCardId,
          categoryId: input.categoryId,
          settlementStatus: input.settlementStatus,
        }),
      updateInvestmentTransfer: (input: TransactionsInvestmentUpdateInput): TransactionsInvestmentUpdateOutput =>
        requestSync<TransactionsInvestmentUpdateOutput>("POST", "/api/transactions/investments/edit", {
          transferGroupId: input.transferGroupId,
          description: input.description,
          amount: input.amount,
          occurredAt: input.occurredAt,
          categoryId: input.categoryId,
          sourceAccountId: input.sourceAccountId,
          destinationAccountId: input.destinationAccountId,
        }),
      deleteTransaction: (input: TransactionsDeleteInput): TransactionsDeleteOutput =>
        requestSync<TransactionsDeleteOutput>("POST", "/api/transactions/delete", { id: input.id }),
      deleteInvestmentTransfer: (input: TransactionsInvestmentDeleteInput): TransactionsInvestmentDeleteOutput =>
        requestSync<TransactionsInvestmentDeleteOutput>("POST", "/api/transactions/investments/delete", {
          transferGroupId: input.transferGroupId,
        }),
      listTransactionsByMonth: (input: TransactionsListInput): TransactionsListOutput => {
        const query = new URLSearchParams({ month: input.month });
        if (input.accountId) query.set("accountId", input.accountId);
        if (input.creditCardId) query.set("creditCardId", input.creditCardId);
        if (input.categoryId) query.set("categoryId", input.categoryId);
        return requestSync<TransactionsListOutput>("GET", `/api/transactions?${query.toString()}`);
      },
    },
    invoicesController: {
      getCardInvoices: (input: CardInvoicesInput): CardInvoicesOutput => {
        const query = new URLSearchParams({ cardId: input.cardId, referenceDate: input.referenceDate });
        return requestSync<CardInvoicesOutput>("GET", `/api/invoices/card?${query.toString()}`);
      },
      getMonthlyCashflowSummary: () => {
        throw new Error("NOT_IMPLEMENTED_IN_API_RUNTIME");
      },
      getMonthlyInvoices: (input: MonthlyInvoicesInput): MonthlyInvoicesOutput =>
        requestSync<MonthlyInvoicesOutput>("GET", `/api/invoices/monthly?month=${encodeURIComponent(input.month)}`),
      getDueObligationsByMonth: (input: DueObligationsInput): DueObligationsOutput =>
        requestSync<DueObligationsOutput>("GET", `/api/invoices/due?dueMonth=${encodeURIComponent(input.dueMonth)}`),
      getCardInvoiceEntriesByDueMonth: (input: CardInvoiceEntriesInput): CardInvoiceEntriesOutput => {
        const query = new URLSearchParams({
          cardId: input.cardId,
          dueMonth: input.dueMonth,
        });
        return requestSync<CardInvoiceEntriesOutput>("GET", `/api/invoices/items?${query.toString()}`);
      },
      settleInvoice: (input: SettleInvoiceInput): SettleInvoiceOutput =>
        requestSync<SettleInvoiceOutput>("POST", "/api/invoices/settle", input),
      unsettleInvoice: (input: UnsettleInvoiceInput): UnsettleInvoiceOutput =>
        requestSync<UnsettleInvoiceOutput>("POST", "/api/invoices/unsettle", input),
    },
    freeBalanceController: {
      getFreeBalance: (input: FreeBalanceInput): FreeBalanceOutput =>
        requestSync<FreeBalanceOutput>("GET", `/api/free-balance?month=${encodeURIComponent(input.month)}`),
    },
    scheduleManagementController: {
      createRecurringSchedule: (input: RecurringCreateInput): RecurringCreateOutput =>
        requestSync<RecurringCreateOutput>("POST", "/api/schedules/recurring", {
          kind: input.kind,
          description: input.description,
          amount: input.amount,
          startMonth: input.startMonth,
          categoryId: input.categoryId,
          accountId: input.accountId,
          creditCardId: input.creditCardId,
        }),
      createInstallmentSchedule: (input: InstallmentCreateInput): InstallmentCreateOutput =>
        requestSync<InstallmentCreateOutput>("POST", "/api/schedules/installment", {
          description: input.description,
          totalAmount: input.totalAmount,
          installmentsCount: input.installmentsCount,
          startMonth: input.startMonth,
          categoryId: input.categoryId,
          accountId: input.accountId,
          creditCardId: input.creditCardId,
        }),
      createLaunch: (input: UnifiedLaunchInput): UnifiedLaunchOutput => {
        return requestSync<UnifiedLaunchOutput>("POST", "/api/launches", input);
      },
      createLaunchBatch: (input: UnifiedLaunchBatchInput): UnifiedLaunchBatchOutput =>
        requestSync<UnifiedLaunchBatchOutput>("POST", "/api/launches/batch", input),
      listSchedules: (_householdId: string): SchedulesListOutput =>
        requestSync<SchedulesListOutput>("GET", "/api/schedules"),
      listMonthInstances: (input: SchedulesMonthInstancesInput): SchedulesMonthInstancesOutput =>
        requestSync<SchedulesMonthInstancesOutput>("GET", `/api/schedules/instances?month=${encodeURIComponent(input.month)}`),
      updateInstanceSettlement: (input: SchedulesInstanceSettlementInput): SchedulesInstanceSettlementOutput =>
        requestSync<SchedulesInstanceSettlementOutput>("POST", "/api/schedules/instances/settlement", input),
      editRecurringSchedule: (input: RecurringEditInput): RecurringEditOutput =>
        requestSync<RecurringEditOutput>("POST", "/api/schedules/recurring/edit", {
          ...input,
          scope: input.scope as RecurringEditScope,
        }),
      editInstallmentSchedule: (input: InstallmentEditInput): InstallmentEditOutput =>
        requestSync<InstallmentEditOutput>("POST", "/api/schedules/installment/edit", input),
      deleteRecurringSchedule: (input: RecurringDeleteInput): RecurringDeleteOutput =>
        requestSync<RecurringDeleteOutput>("POST", "/api/schedules/recurring/delete", input),
      deleteInstallmentSchedule: (input: InstallmentDeleteInput): InstallmentDeleteOutput =>
        requestSync<InstallmentDeleteOutput>("POST", "/api/schedules/installment/delete", input),
      stopRecurringSchedule: (input: RecurringStopInput): RecurringStopOutput =>
        requestSync<RecurringStopOutput>("POST", "/api/schedules/recurring/stop", input),
    },
  };
}

function createRuntime(): Runtime {
  return import.meta.env.MODE === "test" ? createLocalRuntime() : createApiRuntime();
}

const runtime = createRuntime();

export const accountsController = runtime.accountsController;
export const cardsController = runtime.cardsController;
export const categoriesController = runtime.categoriesController;
export const transactionsController = runtime.transactionsController;
export const invoicesController = runtime.invoicesController;
export const freeBalanceController = runtime.freeBalanceController;
export const scheduleManagementController = runtime.scheduleManagementController;

const localUsers: Array<{ userId: string; email: string; password: string; householdId: string }> = [];

function readErrorMessage(response: Response, fallback: string) {
  return response
    .json()
    .then((payload: any) => payload?.message ?? fallback)
    .catch(() => fallback);
}

export function setSessionUser(user: SessionUser | null) {
  activeSessionUser = user;
}

export function getSessionUser() {
  return activeSessionUser;
}

export function getRuntimeHouseholdId() {
  if (import.meta.env.MODE === "test") {
    return resolveHouseholdId("household-main");
  }
  return activeSessionUser?.householdId ?? "";
}

export async function fetchSessionUser(): Promise<SessionUser | null> {
  if (import.meta.env.MODE === "test") {
    return activeSessionUser;
  }

  const response = await fetch("/api/auth/me", { credentials: "include" });
  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorized();
      return null;
    }
    activeSessionUser = null;
    return null;
  }

  const payload = (await response.json()) as { user: SessionUser };
  activeSessionUser = payload.user;
  return payload.user;
}

export async function registerUser(input: { email: string; password: string }): Promise<SessionUser> {
  if (import.meta.env.MODE === "test") {
    const normalizedEmail = input.email.trim().toLowerCase();
    const duplicate = localUsers.find((item) => item.email === normalizedEmail);
    if (duplicate) {
      throw new Error("Nao foi possivel concluir o cadastro.");
    }

    const user: SessionUser = {
      userId: `test-${Date.now()}`,
      email: normalizedEmail,
      householdId: "household-main",
    };
    localUsers.push({ ...user, password: input.password });
    activeSessionUser = user;
    return user;
  }

  const response = await fetch("/api/auth/register", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Falha no cadastro."));
  }

  const payload = (await response.json()) as { user: SessionUser };
  activeSessionUser = payload.user;
  return payload.user;
}

export async function loginUser(input: { email: string; password: string }): Promise<SessionUser> {
  if (import.meta.env.MODE === "test") {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = localUsers.find((item) => item.email === normalizedEmail && item.password === input.password);
    if (!user) {
      throw new Error("Credenciais invalidas");
    }

    activeSessionUser = { userId: user.userId, email: user.email, householdId: user.householdId };
    return activeSessionUser;
  }

  const response = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Credenciais invalidas"));
  }

  const payload = (await response.json()) as { user: SessionUser };
  activeSessionUser = payload.user;
  return payload.user;
}

export async function logoutUser() {
  if (import.meta.env.MODE === "test") {
    activeSessionUser = null;
    return;
  }

  await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  activeSessionUser = null;
}
