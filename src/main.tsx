import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import type { RouteKey } from "./app/routes";
import LoginPage from "./app/auth/login-page";
import RegisterPage from "./app/auth/register-page";
import { fetchSessionUser, getSessionUser, logoutUser } from "./app/foundation/runtime";
import { AppShell } from "./components/layout/app-shell";
import { SnackbarProvider } from "./components/ui/snackbar";
import "./styles.css";

registerSW({
  immediate: true,
});

const registerPaths = new Set(["/register", "/cadastro", "/n-account"]);

function normalizePathname(pathname: string): string {
  const raw = (pathname || "/").trim();
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const withoutTrailing = withSlash.replace(/\/+$/g, "");
  const normalized = withoutTrailing === "" ? "/" : withoutTrailing;
  return normalized.toLowerCase();
}

function isRegisterPath(pathname: string): boolean {
  return registerPaths.has(normalizePathname(pathname));
}

function setNoIndexForAuthRoutes(pathname: string) {
  const normalizedPath = normalizePathname(pathname);
  const shouldNoIndex = normalizedPath === "/" || normalizedPath === "/login" || isRegisterPath(normalizedPath);
  const existing = document.querySelector('meta[name="robots"]');

  if (!shouldNoIndex) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (existing) {
    existing.setAttribute("content", "noindex, nofollow");
    return;
  }

  const meta = document.createElement("meta");
  meta.setAttribute("name", "robots");
  meta.setAttribute("content", "noindex, nofollow");
  document.head.appendChild(meta);
}

function App() {
  const [route, setRoute] = React.useState<RouteKey>("cashflow");
  const [darkMode, setDarkMode] = React.useState(true);
  const [loadingSession, setLoadingSession] = React.useState(true);
  const [authenticated, setAuthenticated] = React.useState(false);
  const [pathname, setPathname] = React.useState(() => normalizePathname(window.location.pathname || "/"));

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
  }, [darkMode]);

  React.useEffect(() => {
    let mounted = true;
    fetchSessionUser()
      .then((user) => {
        if (!mounted) {
          return;
        }
        setAuthenticated(Boolean(user));
      })
      .finally(() => {
        if (mounted) {
          setLoadingSession(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const goTo = (next: string) => {
    const normalizedNext = normalizePathname(next);
    if (normalizePathname(window.location.pathname) !== normalizedNext) {
      window.history.replaceState({}, "", normalizedNext);
    }
    setPathname(normalizedNext);
  };

  const handleAuthenticated = () => {
    setAuthenticated(true);
    goTo("/");
  };

  const handleGoToRegister = () => {
    goTo("/register");
  };

  const handleLogout = async () => {
    await logoutUser();
    setAuthenticated(false);
    goTo("/");
  };

  React.useEffect(() => {
    setNoIndexForAuthRoutes(normalizePathname(pathname || window.location.pathname || "/"));
  }, [pathname]);

  React.useEffect(() => {
    if (loadingSession) {
      return;
    }

    const current = normalizePathname(pathname || window.location.pathname || "/");
    const user = getSessionUser();

    if (!user && current !== "/" && current !== "/login" && !isRegisterPath(current)) {
      goTo("/");
      return;
    }

    if (user && (current === "/login" || isRegisterPath(current))) {
      goTo("/");
    }
  }, [loadingSession, pathname]);

  if (loadingSession) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center p-4 text-sm font-semibold text-slate-600 dark:text-slate-300">
        Carregando sessao...
      </div>
    );
  }

  if (!authenticated && isRegisterPath(normalizePathname(pathname))) {
    return <RegisterPage onRegistered={handleAuthenticated} />;
  }

  if (!authenticated) {
    return <LoginPage onAuthenticated={handleAuthenticated} onGoToRegister={handleGoToRegister} />;
  }

  return (
    <AppShell
      route={route}
      onRouteChange={setRoute}
      darkMode={darkMode}
      onDarkModeChange={setDarkMode}
      onLogout={handleLogout}
    />
  );
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("ROOT_NOT_FOUND");
}

createRoot(root).render(
  <React.StrictMode>
    <SnackbarProvider>
      <App />
    </SnackbarProvider>
  </React.StrictMode>,
);
