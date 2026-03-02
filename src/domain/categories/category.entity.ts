export function normalizeCategoryName(input: string): string {
  return input.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface CategoryProps {
  id?: string;
  householdId: string;
  name: string;
}

export class Category {
  readonly id?: string;
  readonly householdId: string;
  readonly name: string;
  readonly normalized: string;

  constructor(props: CategoryProps) {
    const normalized = normalizeCategoryName(props.name);

    if (!props.householdId.trim()) {
      throw new Error("householdId is required");
    }

    if (!normalized) {
      throw new Error("category name is required");
    }

    this.id = props.id;
    this.householdId = props.householdId.trim();
    this.name = props.name.trim();
    this.normalized = normalized;
  }
}
