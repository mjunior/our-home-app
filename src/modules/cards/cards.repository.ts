import { randomUUID } from "node:crypto";

export interface CreditCardRecord {
  id: string;
  householdId: string;
  name: string;
  closeDay: number;
  dueDay: number;
}

const cardsStore: CreditCardRecord[] = [];

export class CardsRepository {
  create(data: Omit<CreditCardRecord, "id">): CreditCardRecord {
    const record: CreditCardRecord = {
      id: randomUUID(),
      ...data,
    };

    cardsStore.push(record);
    return record;
  }

  listByHousehold(householdId: string): CreditCardRecord[] {
    return cardsStore.filter((card) => card.householdId === householdId);
  }

  findById(id: string): CreditCardRecord | undefined {
    return cardsStore.find((card) => card.id === id);
  }

  clearAll(): void {
    cardsStore.length = 0;
  }
}
