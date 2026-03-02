import { z } from "zod";

import { Category } from "../../domain/categories/category.entity";
import { CategoriesRepository } from "./categories.repository";

const categoryInputSchema = z.object({
  householdId: z.string().min(1),
  name: z.string().min(1),
});

export interface CreateCategoryInput {
  householdId: string;
  name: string;
}

export class CategoriesService {
  constructor(private readonly repository: CategoriesRepository) {}

  create(input: CreateCategoryInput) {
    const parsed = categoryInputSchema.parse(input);
    const category = new Category(parsed);

    return this.repository.create({
      householdId: category.householdId,
      name: category.name,
      normalized: category.normalized,
    });
  }

  list(householdId: string) {
    return this.repository.listByHousehold(householdId);
  }

  clearAll() {
    this.repository.clearAll();
  }
}
