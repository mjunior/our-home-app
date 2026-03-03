import Decimal from "decimal.js";

export class ScheduleEngineService {
  toMonthKey(isoDate: string): string {
    return isoDate.slice(0, 7);
  }

  monthKeyFromParts(year: number, month: number): string {
    return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}`;
  }

  addMonths(monthKey: string, count: number): string {
    const [year, month] = monthKey.split("-").map(Number);
    const base = new Date(Date.UTC(year, month - 1 + count, 1));
    return this.monthKeyFromParts(base.getUTCFullYear(), base.getUTCMonth() + 1);
  }

  iterateMonths(startMonth: string, endMonthInclusive: string): string[] {
    const months: string[] = [];
    let current = startMonth;

    while (current <= endMonthInclusive) {
      months.push(current);
      current = this.addMonths(current, 1);
    }

    return months;
  }

  splitInstallments(totalAmount: string, count: number): string[] {
    const totalCents = new Decimal(totalAmount).mul(100).toDecimalPlaces(0);
    const baseCents = totalCents.div(count).toDecimalPlaces(0, Decimal.ROUND_FLOOR);

    const values = new Array<string>(count).fill(baseCents.div(100).toFixed(2));
    const usedCents = baseCents.mul(count);
    const remainder = totalCents.minus(usedCents).toNumber();

    for (let index = 0; index < remainder; index += 1) {
      const current = new Decimal(values[index]).mul(100).plus(1).div(100).toFixed(2);
      values[index] = current;
    }

    return values;
  }

  buildInstanceKey(sourceType: string, sourceId: string, sequence: number, monthKey: string): string {
    return `${sourceType}:${sourceId}:${sequence}:${monthKey}`;
  }

  toOccurredAt(monthKey: string): string {
    return `${monthKey}-01T12:00:00.000Z`;
  }
}
