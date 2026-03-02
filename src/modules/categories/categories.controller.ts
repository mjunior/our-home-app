import { CategoriesService, type CreateCategoryInput } from "./categories.service";

export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  createCategory(payload: CreateCategoryInput) {
    return this.service.create(payload);
  }

  listCategories(householdId: string) {
    return this.service.list(householdId);
  }
}
