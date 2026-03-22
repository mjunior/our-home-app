import { useEffect, useState } from "react";

import { Button } from "../ui/button";

export type GoalType = "FINANCIAL" | "PERSONAL" | "FAMILY" | "DREAM";

export interface GoalFormValues {
  title: string;
  description: string;
  type: GoalType;
  targetDate: string | null;
}

interface GoalFormProps {
  onSubmit: (values: GoalFormValues) => void;
  submitLabel?: string;
  initialValues?: Partial<GoalFormValues>;
}

export function goalTypeLabel(type: GoalType) {
  switch (type) {
    case "FINANCIAL":
      return "Financeira";
    case "PERSONAL":
      return "Pessoal";
    case "FAMILY":
      return "Familia";
    case "DREAM":
      return "Sonho";
    default:
      return type;
  }
}

export function GoalForm({ onSubmit, submitLabel = "Salvar meta", initialValues }: GoalFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [type, setType] = useState<GoalType>(initialValues?.type ?? "FINANCIAL");
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ?? "");

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setType(initialValues?.type ?? "FINANCIAL");
    setTargetDate(initialValues?.targetDate ?? "");
  }, [initialValues]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title: title.trim(),
          description: description.trim(),
          type,
          targetDate: targetDate || null,
        });
      }}
    >
      <label>
        Titulo
        <input aria-label="Titulo da meta" value={title} onChange={(event) => setTitle(event.target.value)} required minLength={3} />
      </label>

      <label>
        Descricao
        <textarea
          aria-label="Descricao da meta"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
          minLength={3}
          rows={4}
        />
      </label>

      <label>
        Tipo
        <select aria-label="Tipo da meta" value={type} onChange={(event) => setType(event.target.value as GoalType)}>
          <option value="FINANCIAL">Financeira</option>
          <option value="PERSONAL">Pessoal</option>
          <option value="FAMILY">Familia</option>
          <option value="DREAM">Sonho</option>
        </select>
      </label>

      <label>
        Data alvo
        <input aria-label="Data alvo" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
      </label>

      <Button type="submit" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
