import { createId } from "../../domain/shared/id";

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
      id: createId(),
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

  update(id: string, patch: Partial<Omit<CreditCardRecord, "id" | "householdId">>): CreditCardRecord {
    const card = this.findById(id);
    if (!card) {
      throw new Error("CARD_NOT_FOUND");
    }

    Object.assign(card, patch);
    return card;
  }

  remove(id: string): void {
    for (let index = cardsStore.length - 1; index >= 0; index -= 1) {
      if (cardsStore[index]?.id === id) {
        cardsStore.splice(index, 1);
      }
    }
  }

  clearAll(): void {
    cardsStore.length = 0;
  }
}
