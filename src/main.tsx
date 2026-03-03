import React from "react";
import { createRoot } from "react-dom/client";

import type { RouteKey } from "./app/routes";
import { AppShell } from "./components/layout/app-shell";
import "./styles.css";

function App() {
  const [route, setRoute] = React.useState<RouteKey>("cashflow");
  const [darkMode, setDarkMode] = React.useState(true);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return <AppShell route={route} onRouteChange={setRoute} darkMode={darkMode} onDarkModeChange={setDarkMode} />;
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("ROOT_NOT_FOUND");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
