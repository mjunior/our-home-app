import { z } from "zod";

import { CreditCard } from "../../domain/cards/credit-card.entity";
import { CardsRepository } from "./cards.repository";

const cardInputSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1),
  closeDay: z.number().int(),
  dueDay: z.number().int(),
});

const cardUpdateSchema = cardInputSchema.extend({
  id: z.string().min(1),
});

export interface CreateCardInput {
  householdId: string;
  name: string;
  closeDay: number;
  dueDay: number;
}

export interface UpdateCardInput extends CreateCardInput {
  id: string;
}

export class CardsService {
  constructor(private readonly repository: CardsRepository) {}

  create(input: CreateCardInput) {
    const parsed = cardInputSchema.parse(input);
    const card = new CreditCard(parsed);

    return this.repository.create({
      householdId: card.householdId,
      name: card.name,
      closeDay: card.closeDay,
      dueDay: card.dueDay,
    });
  }

  list(householdId: string) {
    return this.repository.listByHousehold(householdId);
  }

  update(input: UpdateCardInput) {
    const parsed = cardUpdateSchema.parse(input);
    const existing = this.repository.findById(parsed.id);
    if (!existing || existing.householdId !== parsed.householdId) {
      throw new Error("CARD_NOT_FOUND");
    }

    const card = new CreditCard(parsed);
    return this.repository.update(parsed.id, {
      name: card.name,
      closeDay: card.closeDay,
      dueDay: card.dueDay,
    });
  }

  clearAll() {
    this.repository.clearAll();
  }
}
