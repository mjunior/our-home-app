import { MonthCloseService, type CloseMonthInput } from "./month-close.service";

export class MonthCloseController {
  constructor(private readonly service: MonthCloseService) {}

  previewCloseMonth(payload: CloseMonthInput) {
    return this.service.previewCloseMonth(payload);
  }

  confirmCloseMonth(payload: CloseMonthInput) {
    return this.service.confirmCloseMonth(payload);
  }
}
