import { createId } from "../../domain/shared/id";

export interface CategoryRecord {
  id: string;
  householdId: string;
  name: string;
  normalized: string;
}

const categoriesStore: CategoryRecord[] = [];

export class CategoriesRepository {
  create(data: Omit<CategoryRecord, "id">): CategoryRecord {
    const duplicate = categoriesStore.find(
      (item) => item.householdId === data.householdId && item.normalized === data.normalized,
    );

    if (duplicate) {
      throw new Error("CATEGORY_DUPLICATE");
    }

    const record: CategoryRecord = {
      id: createId(),
      ...data,
    };

    categoriesStore.push(record);
    return record;
  }

  listByHousehold(householdId: string): CategoryRecord[] {
    return categoriesStore.filter((category) => category.householdId === householdId);
  }

  findById(id: string): CategoryRecord | undefined {
    return categoriesStore.find((category) => category.id === id);
  }

  findByNormalized(householdId: string, normalized: string): CategoryRecord | undefined {
    return categoriesStore.find((category) => category.householdId === householdId && category.normalized === normalized);
  }

  clearAll(): void {
    categoriesStore.length = 0;
  }
}
