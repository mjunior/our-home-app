import { useMemo, useState } from "react";

import { CategoryForm } from "../../../components/foundation/category-form";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { useSnackbar } from "../../../components/ui/snackbar";
import { categoriesController, getRuntimeHouseholdId } from "../runtime";

export default function CategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const categories = useMemo(() => categoriesController.listCategories(householdId), [refreshKey, householdId]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <h1>Categorias</h1>
        <Badge variant="secondary">Foundation</Badge>
      </section>

      <CategoryForm
        onSubmit={(name) => {
          try {
            categoriesController.createCategory({ householdId, name });
            setRefreshKey((prev) => prev + 1);
            notify({ message: "Categoria cadastrada com sucesso.", tone: "success" });
          } catch {
            notify({ message: "Nao foi possivel cadastrar a categoria.", tone: "error" });
          }
        }}
      />

      <Card className="section-reveal">
        <CardHeader>
          <CardTitle>Categorias cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {categories.map((category) => (
              <li
                key={category.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950/70"
              >
                {category.name}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
