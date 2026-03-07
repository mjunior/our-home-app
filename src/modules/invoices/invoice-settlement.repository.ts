import { createId } from "../../domain/shared/id";

export interface InvoiceSettlementRecord {
  id: string;
  householdId: string;
  cardId: string;
  dueMonth: string;
  paymentAccountId: string;
  paidAt: string;
  paidAmount: string;
}

const settlementsStore: InvoiceSettlementRecord[] = [];

export class InvoiceSettlementRepository {
  upsert(data: Omit<InvoiceSettlementRecord, "id">): InvoiceSettlementRecord {
    const existing = settlementsStore.find(
      (item) =>
        item.householdId === data.householdId &&
        item.cardId === data.cardId &&
        item.dueMonth === data.dueMonth,
    );
    if (existing) {
      Object.assign(existing, data);
      return existing;
    }

    const created: InvoiceSettlementRecord = { id: createId(), ...data };
    settlementsStore.push(created);
    return created;
  }

  remove(input: { householdId: string; cardId: string; dueMonth: string }): { deleted: boolean } {
    const before = settlementsStore.length;
    for (let index = settlementsStore.length - 1; index >= 0; index -= 1) {
      const item = settlementsStore[index];
      if (!item) continue;
      if (
        item.householdId === input.householdId &&
        item.cardId === input.cardId &&
        item.dueMonth === input.dueMonth
      ) {
        settlementsStore.splice(index, 1);
      }
    }
    return { deleted: settlementsStore.length !== before };
  }

  listByHousehold(householdId: string): InvoiceSettlementRecord[] {
    return settlementsStore.filter((item) => item.householdId === householdId);
  }

  findByCardAndDueMonth(input: { householdId: string; cardId: string; dueMonth: string }): InvoiceSettlementRecord | undefined {
    return settlementsStore.find(
      (item) =>
        item.householdId === input.householdId &&
        item.cardId === input.cardId &&
        item.dueMonth === input.dueMonth,
    );
  }

  removeByCard(input: { householdId: string; cardId: string }): { deleted: boolean } {
    const before = settlementsStore.length;
    for (let index = settlementsStore.length - 1; index >= 0; index -= 1) {
      const item = settlementsStore[index];
      if (!item) continue;
      if (item.householdId === input.householdId && item.cardId === input.cardId) {
        settlementsStore.splice(index, 1);
      }
    }
    return { deleted: settlementsStore.length !== before };
  }

  clearAll() {
    settlementsStore.length = 0;
  }
}
