import { useMemo, useState } from "react";

import { CategoryForm } from "../../../components/foundation/category-form";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../../../components/ui/sheet";
import { useSnackbar } from "../../../components/ui/snackbar";
import { categoriesController, getRuntimeHouseholdId } from "../runtime";

export default function CategoriesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [createCategoryModalOpen, setCreateCategoryModalOpen] = useState(false);
  const { notify } = useSnackbar();
  const householdId = getRuntimeHouseholdId();
  const categories = useMemo(() => categoriesController.listCategories(householdId), [refreshKey, householdId]);

  return (
    <main className="space-y-4">
      <section className="section-reveal flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Categorias</h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">Organize gastos e receitas com tags da casa.</p>
        </div>
        <Button type="button" onClick={() => setCreateCategoryModalOpen(true)}>
          Nova categoria
        </Button>
      </section>

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

      <Sheet open={createCategoryModalOpen} onOpenChange={setCreateCategoryModalOpen}>
        <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[88vh] w-[94%] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
          <SheetHeader>
            <SheetTitle>Nova categoria</SheetTitle>
            <SheetDescription>Selecione um emoji e informe o nome da categoria.</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <CategoryForm
              onSubmit={(name) => {
                try {
                  categoriesController.createCategory({ householdId, name });
                  setRefreshKey((prev) => prev + 1);
                  setCreateCategoryModalOpen(false);
                  notify({ message: "Categoria cadastrada com sucesso.", tone: "success" });
                } catch {
                  notify({ message: "Nao foi possivel cadastrar a categoria.", tone: "error" });
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
