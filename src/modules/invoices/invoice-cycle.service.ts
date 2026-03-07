function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, date.getUTCDate()));
}

function toDueDateForMonth(monthKey: string, dueDay: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const dueDate = new Date(Date.UTC(year, month - 1, dueDay));
  return dueDate.toISOString();
}

export interface InvoiceCycle {
  monthKey: string;
  dueDate: string;
}

export class InvoiceCycleService {
  resolveExpenseCycle(occurredAtIso: string, closeDay: number, dueDay: number): InvoiceCycle {
    const occurredAt = new Date(occurredAtIso);
    const day = occurredAt.getUTCDate();

    const cycleBase = day >= closeDay ? addMonths(occurredAt, 1) : occurredAt;
    const monthKey = toMonthKey(cycleBase);

    return {
      monthKey,
      dueDate: toDueDateForMonth(monthKey, dueDay),
    };
  }

  resolveCurrentAndNext(referenceIso: string, closeDay: number, dueDay: number): {
    current: InvoiceCycle;
    next: InvoiceCycle;
  } {
    const reference = new Date(referenceIso);
    const day = reference.getUTCDate();

    const currentBase = day >= closeDay ? addMonths(reference, 1) : reference;
    const nextBase = addMonths(currentBase, 1);

    const currentMonthKey = toMonthKey(currentBase);
    const nextMonthKey = toMonthKey(nextBase);

    return {
      current: {
        monthKey: currentMonthKey,
        dueDate: toDueDateForMonth(currentMonthKey, dueDay),
      },
      next: {
        monthKey: nextMonthKey,
        dueDate: toDueDateForMonth(nextMonthKey, dueDay),
      },
    };
  }
}
