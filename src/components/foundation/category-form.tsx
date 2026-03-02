import { useState } from "react";

interface CategoryFormProps {
  onSubmit: (name: string) => void;
}

export function CategoryForm({ onSubmit }: CategoryFormProps) {
  const [name, setName] = useState("");

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name);
        setName("");
      }}
    >
      <label>
        Nome da categoria
        <input
          aria-label="Nome da categoria"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <button type="submit">Adicionar categoria</button>
    </form>
  );
}
