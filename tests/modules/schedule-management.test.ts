import { describe, expect, it } from "vitest";

import { AccountsRepository } from "../../src/modules/accounts/accounts.repository";
import { CardsRepository } from "../../src/modules/cards/cards.repository";
import { CategoriesRepository } from "../../src/modules/categories/categories.repository";
import { InstallmentsService } from "../../src/modules/scheduling/installments.service";
import { RecurrenceService } from "../../src/modules/scheduling/recurrence.service";
import { ScheduleEngineService } from "../../src/modules/scheduling/schedule-engine.service";
import { ScheduleManagementService } from "../../src/modules/scheduling/schedule-management.service";
import { ScheduleRepository } from "../../src/modules/scheduling/schedule.repository";
import { TransactionsRepository } from "../../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../../src/modules/transactions/transactions.service";

const householdId = "household-main";

describe("schedule management", () => {
  it("edits recurrence from effective month without changing historical instances", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Academia",
      amount: "100.00",
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    management.editRecurringSchedule({
      ruleId: rule.id,
      effectiveMonth: "2026-06",
      amount: "150.00",
    });

    const allRules = repository.listRecurringRules(householdId);
    expect(allRules.filter((item) => item.active)).toHaveLength(1);

    const oldInstances = repository.listInstancesBySource("RECURRING", rule.id);
    expect(oldInstances.every((item) => item.monthKey < "2026-06")).toBe(true);
    expect(oldInstances.every((item) => item.amount === "100.00")).toBe(true);

    const activeRule = allRules.find((item) => item.active)!;
    const newInstances = repository.listInstancesBySource("RECURRING", activeRule.id);
    expect(newInstances[0].monthKey).toBe("2026-06");
    expect(newInstances[0].amount).toBe("150.00");
  });

  it("stops recurrence from target month forward", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Streaming",
      amount: "50.00",
      startMonth: "2026-03",
      categoryId: "cat-2",
      accountId: "acc-1",
    });

    management.stopRecurringSchedule({ ruleId: rule.id, stopFromMonth: "2026-07" });

    const instances = repository.listInstancesBySource("RECURRING", rule.id);
    expect(instances.every((item) => item.monthKey < "2026-07")).toBe(true);

    const stoppedRule = repository.findRecurringRuleById(rule.id)!;
    expect(stoppedRule.active).toBe(false);
  });

  it("updates settlement status for account recurring instance", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const management = new ScheduleManagementService(
      repository,
      new InstallmentsService(repository, engine),
      new RecurrenceService(repository, engine),
      engine,
    );

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "INCOME",
      description: "Salario",
      amount: "1000.00",
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    const instance = repository.listInstancesBySource("RECURRING", rule.id)[0]!;
    expect(instance.settlementStatus).toBe("UNPAID");

    const updated = management.updateInstanceSettlement({
      instanceId: instance.id,
      settlementStatus: "PAID",
    });
    expect(updated.settlementStatus).toBe("PAID");
  });

  it("creates one-off launch via unified contract", () => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();

    const account = accountsRepo.create({
      householdId,
      name: "Conta Casa",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const category = categoriesRepo.create({
      householdId,
      name: "Mercado",
      normalized: "mercado",
    });

    const transactionsService = new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo);
    const engine = new ScheduleEngineService();
    const management = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
      transactionsService,
    );

    const created = management.createUnifiedLaunch({
      launchType: "ONE_OFF",
      transaction: {
        householdId,
        kind: "INCOME",
        description: "Salario",
        amount: "3500.00",
        occurredAt: "2026-03-01T12:00:00.000Z",
        accountId: account.id,
        categoryId: category.id,
      },
    });

    expect("kind" in created ? created.kind : "UNKNOWN").toBe("INCOME");
    expect(transactionsRepo.listByHousehold(householdId)).toHaveLength(1);
  });

  it("edits installment from effective month for current and future instances", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const plan = management.createInstallmentSchedule({
      householdId,
      description: "Notebook",
      totalAmount: "900.00",
      installmentsCount: 3,
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    management.editInstallmentSchedule({
      planId: plan.id,
      effectiveMonth: "2026-03",
      amount: "350.00",
      description: "Notebook Ajustado",
    });

    const instances = repository.listInstancesBySource("INSTALLMENT", plan.id);
    expect(instances).toHaveLength(3);
    expect(instances.every((item) => item.amount === "350.00")).toBe(true);
    expect(instances[0]?.description).toContain("Notebook Ajustado");
  });

  it("creates investment launch via unified contract with linked transfer", () => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();

    const checking = accountsRepo.create({
      householdId,
      name: "Conta Casa",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const investment = accountsRepo.create({
      householdId,
      name: "Reserva",
      type: "INVESTMENT",
      openingBalance: "0.00",
    });
    const category = categoriesRepo.create({
      householdId,
      name: "Investimento",
      normalized: "investimento",
    });

    const transactionsService = new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo);
    const engine = new ScheduleEngineService();
    const management = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
      transactionsService,
    );

    const created = management.createUnifiedLaunch({
      launchType: "INVESTMENT",
      investment: {
        householdId,
        description: "Aporte",
        amount: "300.00",
        occurredAt: "2026-03-01T12:00:00.000Z",
        categoryId: category.id,
        sourceAccountId: checking.id,
        destinationAccountId: investment.id,
      },
    });

    expect("transferGroupId" in created ? created.transferGroupId : "").not.toBe("");
    expect(transactionsRepo.listByHousehold(householdId)).toHaveLength(2);
  });

  it("deletes recurring including historical when scope is ALL", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Internet",
      amount: "120.00",
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    management.deleteRecurringSchedule({
      ruleId: rule.id,
      fromMonth: "2026-03",
      scope: "ALL",
    });

    expect(repository.findRecurringRuleById(rule.id)).toBeUndefined();
    expect(repository.listInstancesBySource("RECURRING", rule.id)).toHaveLength(0);
  });

  it("deletes entire recurring revision chain when scope is ALL", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const original = management.createRecurringSchedule({
      householdId,
      kind: "EXPENSE",
      description: "Condominio",
      amount: "300.00",
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    const revised = management.editRecurringSchedule({
      ruleId: original.id,
      effectiveMonth: "2026-05",
      amount: "350.00",
    });

    management.deleteRecurringSchedule({
      ruleId: revised.id,
      fromMonth: "2026-05",
      scope: "ALL",
    });

    expect(repository.listRecurringRules(householdId)).toHaveLength(0);
    expect(repository.listInstancesByHousehold(householdId)).toHaveLength(0);
  });

  it("deletes current and future recurring even when future instances are locked", () => {
    const repository = new ScheduleRepository();
    repository.clearAll();

    const engine = new ScheduleEngineService();
    const installments = new InstallmentsService(repository, engine);
    const recurrence = new RecurrenceService(repository, engine);
    const management = new ScheduleManagementService(repository, installments, recurrence, engine);

    const rule = management.createRecurringSchedule({
      householdId,
      kind: "INCOME",
      description: "Receita",
      amount: "100.00",
      startMonth: "2026-03",
      categoryId: "cat-1",
      accountId: "acc-1",
    });

    const instances = repository.listInstancesBySource("RECURRING", rule.id);
    for (const instance of instances.filter((item) => item.monthKey >= "2026-04")) {
      repository.updateScheduledInstance(instance.id, { locked: true });
    }

    management.deleteRecurringSchedule({
      ruleId: rule.id,
      fromMonth: "2026-04",
      scope: "CURRENT_AND_FUTURE",
    });

    const remaining = repository.listInstancesBySource("RECURRING", rule.id);
    expect(remaining.every((item) => item.monthKey < "2026-04")).toBe(true);
  });

  it("imports batch launches with partial success", () => {
    const accountsRepo = new AccountsRepository();
    const cardsRepo = new CardsRepository();
    const categoriesRepo = new CategoriesRepository();
    const transactionsRepo = new TransactionsRepository();
    const scheduleRepo = new ScheduleRepository();
    accountsRepo.clearAll();
    cardsRepo.clearAll();
    categoriesRepo.clearAll();
    transactionsRepo.clearAll();
    scheduleRepo.clearAll();

    const account = accountsRepo.create({
      householdId,
      name: "Conta Casa",
      type: "CHECKING",
      openingBalance: "1000.00",
    });
    const category = categoriesRepo.create({
      householdId,
      name: "Mercado",
      normalized: "mercado",
    });

    const transactionsService = new TransactionsService(transactionsRepo, accountsRepo, cardsRepo, categoriesRepo);
    const engine = new ScheduleEngineService();
    const management = new ScheduleManagementService(
      scheduleRepo,
      new InstallmentsService(scheduleRepo, engine),
      new RecurrenceService(scheduleRepo, engine),
      engine,
      transactionsService,
    );

    const result = management.createLaunchBatch({
      entries: [
        {
          launchType: "ONE_OFF",
          transaction: {
            householdId,
            kind: "EXPENSE",
            description: "Mercado",
            amount: "80.00",
            occurredAt: "2026-03-01T12:00:00.000Z",
            accountId: account.id,
            categoryId: category.id,
          },
        },
        {
          launchType: "ONE_OFF",
          transaction: {
            householdId,
            kind: "INCOME",
            description: "Entrada invalida",
            amount: "200.00",
            occurredAt: "2026-03-02T12:00:00.000Z",
            creditCardId: "card-missing",
            categoryId: category.id,
          },
        },
      ],
    });

    expect(result.total).toBe(2);
    expect(result.created).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors[0]?.index).toBe(1);
    expect(result.errors[0]?.error).toBe("INCOME_REQUIRES_ACCOUNT_ONLY");
    expect(transactionsRepo.listByHousehold(householdId)).toHaveLength(1);
  });
});
