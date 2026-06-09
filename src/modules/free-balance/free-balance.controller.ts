import type { GetFreeBalanceInput, GetFreeBalanceProjectionInput } from "./free-balance.types";
import { FreeBalanceService } from "./free-balance.service";

export class FreeBalanceController {
  constructor(private readonly service: FreeBalanceService) {}

  getFreeBalance(payload: GetFreeBalanceInput) {
    return this.service.getFreeBalance(payload);
  }

  getFreeBalanceProjection(payload: GetFreeBalanceProjectionInput) {
    return this.service.getFreeBalanceProjection(payload);
  }
}
