import { useState } from "react";

interface CategoryFormProps {
  onSubmit: (name: string) => void;
}

const CATEGORY_EMOJIS = ["🏠", "🛒", "🚗", "💊", "🎓", "🎉", "💡", "💧", "🐾", "💰", "📈", "📱"];

export function CategoryForm({ onSubmit }: CategoryFormProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string>("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const normalizedName = name.trim();
        if (!normalizedName) {
          return;
        }
        onSubmit(emoji ? `${emoji} ${normalizedName}` : normalizedName);
        setName("");
        setEmoji("");
      }}
      className="space-y-4"
    >
      <fieldset>
        <legend className="text-sm font-medium">Emoji da categoria</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded-lg border px-2 py-1 text-sm ${emoji === "" ? "border-brand-teal dark:border-brand-lime" : "border-slate-300 dark:border-slate-700"}`}
            onClick={() => setEmoji("")}
          >
            Sem emoji
          </button>
          {CATEGORY_EMOJIS.map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`Emoji ${item}`}
              className={`rounded-lg border px-2 py-1 text-lg ${emoji === item ? "border-brand-teal dark:border-brand-lime" : "border-slate-300 dark:border-slate-700"}`}
              onClick={() => setEmoji(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </fieldset>

      <label>
        Nome da categoria
        <input
          aria-label="Nome da categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <p className="text-xs text-slate-500 dark:text-slate-300">
        Preview: {emoji ? `${emoji} ` : ""}
        {name.trim() || "Nome da categoria"}
      </p>
      <button type="submit">Adicionar categoria</button>
    </form>
  );
}
