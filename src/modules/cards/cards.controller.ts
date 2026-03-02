import { CardsService, type CreateCardInput } from "./cards.service";

export class CardsController {
  constructor(private readonly service: CardsService) {}

  createCard(payload: CreateCardInput) {
    return this.service.create(payload);
  }

  listCards(householdId: string) {
    return this.service.list(householdId);
  }
}
