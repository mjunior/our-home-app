import type { GetFreeBalanceInput } from "./free-balance.types";
import { FreeBalanceService } from "./free-balance.service";

export class FreeBalanceController {
  constructor(private readonly service: FreeBalanceService) {}

  getFreeBalance(payload: GetFreeBalanceInput) {
    return this.service.getFreeBalance(payload);
  }
}
