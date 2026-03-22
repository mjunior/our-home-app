import { useEffect, useState } from "react";

import { Button } from "../ui/button";

export type GoalType = "FINANCIAL" | "PERSONAL" | "FAMILY" | "DREAM";
export type GoalMetricType = "PERCENTAGE" | "QUANTITY" | "OCCURRENCE";

export interface GoalFormValues {
  title: string;
  description: string;
  type: GoalType;
  targetDate: string | null;
  metricType: GoalMetricType;
  metricValue: number;
  metricTarget: number | null;
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

export function metricTypeLabel(type: GoalMetricType) {
  switch (type) {
    case "PERCENTAGE":
      return "Porcentagem";
    case "QUANTITY":
      return "Quantidade";
    case "OCCURRENCE":
      return "Ocorrencias";
    default:
      return type;
  }
}

function parseOptionalPositiveInteger(value: string) {
  if (!value.trim()) return null;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

export function GoalForm({ onSubmit, submitLabel = "Salvar meta", initialValues }: GoalFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [type, setType] = useState<GoalType>(initialValues?.type ?? "FINANCIAL");
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ?? "");
  const [metricType, setMetricType] = useState<GoalMetricType>(initialValues?.metricType ?? "PERCENTAGE");
  const [metricValue, setMetricValue] = useState(String(initialValues?.metricValue ?? 0));
  const [metricTarget, setMetricTarget] = useState(
    initialValues?.metricTarget == null ? "" : String(initialValues.metricTarget),
  );
  const [metricError, setMetricError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setDescription(initialValues?.description ?? "");
    setType(initialValues?.type ?? "FINANCIAL");
    setTargetDate(initialValues?.targetDate ?? "");
    setMetricType(initialValues?.metricType ?? "PERCENTAGE");
    setMetricValue(String(initialValues?.metricValue ?? 0));
    setMetricTarget(initialValues?.metricTarget == null ? "" : String(initialValues.metricTarget));
    setMetricError(null);
  }, [initialValues]);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();

        const parsedMetricValue = Number.parseInt(metricValue, 10);
        if (Number.isNaN(parsedMetricValue) || parsedMetricValue < 0) {
          setMetricError("Informe um valor inteiro maior ou igual a 0.");
          return;
        }

        if (metricType === "PERCENTAGE" && parsedMetricValue > 100) {
          setMetricError("Para porcentagem, o valor deve estar entre 0 e 100.");
          return;
        }

        const parsedMetricTarget = parseOptionalPositiveInteger(metricTarget);

        if (metricType === "QUANTITY" && parsedMetricTarget == null) {
          setMetricError("Para quantidade, informe uma meta alvo maior que 0.");
          return;
        }

        if ((metricType === "OCCURRENCE" || metricType === "PERCENTAGE") && metricTarget.trim() && parsedMetricTarget == null) {
          setMetricError("Quando informado, o alvo deve ser maior que 0.");
          return;
        }

        setMetricError(null);
        onSubmit({
          title: title.trim(),
          description: description.trim(),
          type,
          targetDate: targetDate || null,
          metricType,
          metricValue: parsedMetricValue,
          metricTarget: metricType === "PERCENTAGE" ? null : parsedMetricTarget,
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
        Tipo de metrica
        <select
          aria-label="Tipo de metrica"
          value={metricType}
          onChange={(event) => {
            const nextType = event.target.value as GoalMetricType;
            setMetricType(nextType);
            setMetricError(null);
            if (nextType === "PERCENTAGE") {
              setMetricTarget("");
            }
          }}
        >
          <option value="PERCENTAGE">Porcentagem</option>
          <option value="QUANTITY">Quantidade</option>
          <option value="OCCURRENCE">Ocorrencias</option>
        </select>
      </label>

      <label>
        Valor atual
        <input
          aria-label="Valor atual"
          type="number"
          min={0}
          step={1}
          value={metricValue}
          onChange={(event) => {
            setMetricValue(event.target.value);
            setMetricError(null);
          }}
          required
        />
      </label>

      {metricType !== "PERCENTAGE" ? (
        <label>
          Meta alvo {metricType === "QUANTITY" ? "*" : "(opcional)"}
          <input
            aria-label="Meta alvo"
            type="number"
            min={1}
            step={1}
            value={metricTarget}
            onChange={(event) => {
              setMetricTarget(event.target.value);
              setMetricError(null);
            }}
            required={metricType === "QUANTITY"}
          />
        </label>
      ) : null}

      {metricError ? <p className="text-sm text-rose-600 dark:text-rose-300">{metricError}</p> : null}

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
