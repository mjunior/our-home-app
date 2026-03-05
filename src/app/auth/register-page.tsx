import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useSnackbar } from "../../components/ui/snackbar";
import { registerUser } from "../foundation/runtime";

interface RegisterPageProps {
  onRegistered: () => void;
}

export default function RegisterPage({ onRegistered }: RegisterPageProps) {
  const { notify } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await registerUser({ email, password });
      notify({ tone: "success", message: "Conta criada com sucesso." });
      onRegistered();
    } catch (error: any) {
      notify({ tone: "error", message: error?.message ?? "Nao foi possivel concluir o cadastro." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>Cadastro isolado em /n-account para habilitar a sessao autenticada.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
            />

            <label htmlFor="register-password">Senha (minimo 6 caracteres)</label>
            <input
              id="register-password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              minLength={6}
            />

            <Button type="submit" disabled={busy} className="mt-2 w-full">
              {busy ? "Criando..." : "Criar conta"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
