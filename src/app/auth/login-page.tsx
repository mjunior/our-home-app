import React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useSnackbar } from "../../components/ui/snackbar";
import { loginUser } from "../foundation/runtime";

interface LoginPageProps {
  onAuthenticated: () => void;
}

export default function LoginPage({ onAuthenticated }: LoginPageProps) {
  const { notify } = useSnackbar();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await loginUser({ email, password });
      notify({ tone: "success", message: "Login realizado." });
      onAuthenticated();
    } catch (error: any) {
      notify({ tone: "error", message: error?.message ?? "Credenciais invalidas" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center p-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>Acesse sua conta para continuar no controle da casa.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
            />

            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              minLength={6}
            />

            <Button type="submit" disabled={busy} className="mt-2 w-full">
              {busy ? "Entrando..." : "Entrar"}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
}
