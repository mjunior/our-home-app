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
import { InvoicesService } from "../../modules/invoices/invoices.service";
import { InstallmentsService } from "../../modules/scheduling/installments.service";
import { RecurrenceService } from "../../modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../modules/scheduling/schedule-engine.service";
import { ScheduleManagementController } from "../../modules/scheduling/schedule-management.controller";
import { ScheduleManagementService } from "../../modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../modules/scheduling/schedule.repository";
import { TransactionsController } from "../../modules/transactions/transactions.controller";
import { TransactionsRepository } from "../../modules/transactions/transactions.repository";
import { TransactionsService } from "../../modules/transactions/transactions.service";

type MethodArgs<T> = T extends (...args: infer A) => unknown ? A : never;
type MethodReturn<T> = T extends (...args: any[]) => infer R ? R : never;
type AccountsControllerContract = Pick<AccountsController, "createAccount" | "listAccounts" | "getConsolidatedBalance">;
type CardsControllerContract = Pick<CardsController, "createCard" | "listCards">;
type CategoriesControllerContract = Pick<CategoriesController, "createCategory" | "listCategories">;
type TransactionsControllerContract = Pick<TransactionsController, "createTransaction" | "listTransactionsByMonth">;
type InvoicesControllerContract = Pick<InvoicesController, "getCardInvoices" | "getMonthlyCashflowSummary" | "getDueObligationsByMonth">;
type FreeBalanceControllerContract = Pick<FreeBalanceController, "getFreeBalance">;
type ScheduleManagementControllerContract = Pick<
  ScheduleManagementController,
  "createRecurringSchedule" | "createInstallmentSchedule" | "listSchedules" | "editRecurringSchedule" | "stopRecurringSchedule"
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

function requestSync<T>(method: "GET" | "POST", url: string, payload?: unknown): T {
  const request = new XMLHttpRequest();
  request.open(method, url, false);
  request.setRequestHeader("Content-Type", "application/json");

  request.send(payload ? JSON.stringify(payload) : null);

  if (request.status >= 400 || request.status === 0) {
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
  const scheduleEngine = new ScheduleEngineService();

  const accountsController = new AccountsController(new AccountsService(accountsRepository));
  const cardsController = new CardsController(new CardsService(cardsRepository));
  const categoriesController = new CategoriesController(new CategoriesService(categoriesRepository));
  const transactionsController = new TransactionsController(
    new TransactionsService(transactionsRepository, accountsRepository, cardsRepository, categoriesRepository),
  );
  const invoicesController = new InvoicesController(
    new InvoicesService(transactionsRepository, cardsRepository, new InvoiceCycleService()),
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
    ),
  );

  return {
    accountsController,
    cardsController,
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
  type AccountsListOutput = MethodReturn<Runtime["accountsController"]["listAccounts"]>;
  type AccountsConsolidatedOutput = MethodReturn<Runtime["accountsController"]["getConsolidatedBalance"]>;

  type CardsCreateInput = MethodArgs<Runtime["cardsController"]["createCard"]>[0];
  type CardsCreateOutput = MethodReturn<Runtime["cardsController"]["createCard"]>;
  type CardsListOutput = MethodReturn<Runtime["cardsController"]["listCards"]>;

  type CategoriesCreateInput = MethodArgs<Runtime["categoriesController"]["createCategory"]>[0];
  type CategoriesCreateOutput = MethodReturn<Runtime["categoriesController"]["createCategory"]>;
  type CategoriesListOutput = MethodReturn<Runtime["categoriesController"]["listCategories"]>;

  type TransactionsCreateInput = MethodArgs<Runtime["transactionsController"]["createTransaction"]>[0];
  type TransactionsCreateOutput = MethodReturn<Runtime["transactionsController"]["createTransaction"]>;
  type TransactionsListInput = MethodArgs<Runtime["transactionsController"]["listTransactionsByMonth"]>[0];
  type TransactionsListOutput = MethodReturn<Runtime["transactionsController"]["listTransactionsByMonth"]>;

  type CardInvoicesInput = MethodArgs<Runtime["invoicesController"]["getCardInvoices"]>[0];
  type CardInvoicesOutput = MethodReturn<Runtime["invoicesController"]["getCardInvoices"]>;

  type FreeBalanceInput = MethodArgs<Runtime["freeBalanceController"]["getFreeBalance"]>[0];
  type FreeBalanceOutput = MethodReturn<Runtime["freeBalanceController"]["getFreeBalance"]>;

  type RecurringCreateInput = MethodArgs<Runtime["scheduleManagementController"]["createRecurringSchedule"]>[0];
  type RecurringCreateOutput = MethodReturn<Runtime["scheduleManagementController"]["createRecurringSchedule"]>;
  type InstallmentCreateInput = MethodArgs<Runtime["scheduleManagementController"]["createInstallmentSchedule"]>[0];
  type InstallmentCreateOutput = MethodReturn<Runtime["scheduleManagementController"]["createInstallmentSchedule"]>;
  type SchedulesListOutput = MethodReturn<Runtime["scheduleManagementController"]["listSchedules"]>;
  type RecurringEditInput = MethodArgs<Runtime["scheduleManagementController"]["editRecurringSchedule"]>[0];
  type RecurringEditOutput = MethodReturn<Runtime["scheduleManagementController"]["editRecurringSchedule"]>;
  type RecurringStopInput = MethodArgs<Runtime["scheduleManagementController"]["stopRecurringSchedule"]>[0];
  type RecurringStopOutput = MethodReturn<Runtime["scheduleManagementController"]["stopRecurringSchedule"]>;

  return {
    accountsController: {
      createAccount: (input: AccountsCreateInput): AccountsCreateOutput =>
        requestSync<AccountsCreateOutput>("POST", "/api/accounts", input),
      listAccounts: (householdId: string): AccountsListOutput =>
        requestSync<AccountsListOutput>("GET", `/api/accounts?householdId=${encodeURIComponent(householdId)}`),
      getConsolidatedBalance: (householdId: string): AccountsConsolidatedOutput =>
        requestSync<AccountsConsolidatedOutput>("GET", `/api/accounts/consolidated?householdId=${encodeURIComponent(householdId)}`),
    },
    cardsController: {
      createCard: (input: CardsCreateInput): CardsCreateOutput => requestSync<CardsCreateOutput>("POST", "/api/cards", input),
      listCards: (householdId: string): CardsListOutput =>
        requestSync<CardsListOutput>("GET", `/api/cards?householdId=${encodeURIComponent(householdId)}`),
    },
    categoriesController: {
      createCategory: (input: CategoriesCreateInput): CategoriesCreateOutput =>
        requestSync<CategoriesCreateOutput>("POST", "/api/categories", input),
      listCategories: (householdId: string): CategoriesListOutput =>
        requestSync<CategoriesListOutput>("GET", `/api/categories?householdId=${encodeURIComponent(householdId)}`),
    },
    transactionsController: {
      createTransaction: (input: TransactionsCreateInput): TransactionsCreateOutput =>
        requestSync<TransactionsCreateOutput>("POST", "/api/transactions", input),
      listTransactionsByMonth: (input: TransactionsListInput): TransactionsListOutput => {
        const query = new URLSearchParams({
          householdId: input.householdId,
          month: input.month,
        });
        if (input.accountId) query.set("accountId", input.accountId);
        if (input.creditCardId) query.set("creditCardId", input.creditCardId);
        if (input.categoryId) query.set("categoryId", input.categoryId);
        return requestSync<TransactionsListOutput>("GET", `/api/transactions?${query.toString()}`);
      },
    },
    invoicesController: {
      getCardInvoices: (input: CardInvoicesInput): CardInvoicesOutput => {
        const query = new URLSearchParams({
          householdId: input.householdId,
          cardId: input.cardId,
          referenceDate: input.referenceDate,
        });
        return requestSync<CardInvoicesOutput>("GET", `/api/invoices/card?${query.toString()}`);
      },
      getMonthlyCashflowSummary: () => {
        throw new Error("NOT_IMPLEMENTED_IN_API_RUNTIME");
      },
      getDueObligationsByMonth: () => {
        throw new Error("NOT_IMPLEMENTED_IN_API_RUNTIME");
      },
    },
    freeBalanceController: {
      getFreeBalance: (input: FreeBalanceInput): FreeBalanceOutput =>
        requestSync<FreeBalanceOutput>(
          "GET",
          `/api/free-balance?householdId=${encodeURIComponent(input.householdId)}&month=${encodeURIComponent(input.month)}`,
        ),
    },
    scheduleManagementController: {
      createRecurringSchedule: (input: RecurringCreateInput): RecurringCreateOutput =>
        requestSync<RecurringCreateOutput>("POST", "/api/schedules/recurring", input),
      createInstallmentSchedule: (input: InstallmentCreateInput): InstallmentCreateOutput =>
        requestSync<InstallmentCreateOutput>("POST", "/api/schedules/installment", input),
      listSchedules: (householdId: string): SchedulesListOutput =>
        requestSync<SchedulesListOutput>("GET", `/api/schedules?householdId=${encodeURIComponent(householdId)}`),
      editRecurringSchedule: (input: RecurringEditInput): RecurringEditOutput =>
        requestSync<RecurringEditOutput>("POST", "/api/schedules/recurring/edit", input),
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
