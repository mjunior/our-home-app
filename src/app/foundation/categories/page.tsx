import { useMemo, useState } from "react";

import { CategoryForm } from "../../../components/foundation/category-form";
import { categoriesController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function CategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main className="space-y-4">
      <h1>Categorias</h1>
      <CategoryForm
        onSubmit={(name) => {
          categoriesController.createCategory({ householdId: HOUSEHOLD_ID, name });
          setRefreshKey((prev) => prev + 1);
        }}
      />
      <ul className="panel">
        {categories.map((category) => (
          <li key={category.id} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950/70">
            {category.name}
          </li>
        ))}
      </ul>
    </main>
  );
}
