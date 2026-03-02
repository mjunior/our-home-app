import { useMemo, useState } from "react";

import { CategoryForm } from "../../../components/foundation/category-form";
import { categoriesController } from "../runtime";

const HOUSEHOLD_ID = "household-main";

export default function CategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const categories = useMemo(() => categoriesController.listCategories(HOUSEHOLD_ID), [refreshKey]);

  return (
    <main>
      <h1>Categorias</h1>
      <CategoryForm
        onSubmit={(name) => {
          categoriesController.createCategory({ householdId: HOUSEHOLD_ID, name });
          setRefreshKey((prev) => prev + 1);
        }}
      />
      <ul>
        {categories.map((category) => (
          <li key={category.id}>{category.name}</li>
        ))}
      </ul>
    </main>
  );
}
