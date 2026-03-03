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

const accountsRepository = new AccountsRepository();
const cardsRepository = new CardsRepository();
const categoriesRepository = new CategoriesRepository();
const transactionsRepository = new TransactionsRepository();
const scheduleRepository = new ScheduleRepository();
const scheduleEngine = new ScheduleEngineService();

export const accountsController = new AccountsController(new AccountsService(accountsRepository));
export const cardsController = new CardsController(new CardsService(cardsRepository));
export const categoriesController = new CategoriesController(new CategoriesService(categoriesRepository));
export const transactionsController = new TransactionsController(
  new TransactionsService(transactionsRepository, accountsRepository, cardsRepository, categoriesRepository),
);
export const invoicesController = new InvoicesController(
  new InvoicesService(transactionsRepository, cardsRepository, new InvoiceCycleService()),
);
export const freeBalanceController = new FreeBalanceController(
  new FreeBalanceService(
    accountsRepository,
    cardsRepository,
    transactionsRepository,
    scheduleRepository,
    new InvoiceCycleService(),
    new FreeBalancePolicy(),
  ),
);
export const scheduleManagementController = new ScheduleManagementController(
  new ScheduleManagementService(
    scheduleRepository,
    new InstallmentsService(scheduleRepository, scheduleEngine),
    new RecurrenceService(scheduleRepository, scheduleEngine),
    scheduleEngine,
  ),
);
