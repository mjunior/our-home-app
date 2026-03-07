import React from "react";
import { Menu, MoonStar, Plus, SunMedium } from "lucide-react";

import type { RouteKey } from "../../app/routes";
import { routes } from "../../app/routes";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface AppShellProps {
  route: RouteKey;
  onRouteChange: (next: RouteKey) => void;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
  onLogout: () => void;
}

const quickRoutes: RouteKey[] = ["cashflow", "accounts", "cards", "schedules"];

function NavItems({ route, onRouteChange }: { route: RouteKey; onRouteChange: (next: RouteKey) => void }) {
  return (
    <nav className="space-y-2">
      {(Object.keys(routes) as RouteKey[]).map((key) => {
        const active = key === route;
        return (
          <Button
            key={key}
            type="button"
            variant={active ? "lime" : "ghost"}
            className="h-11 w-full justify-start rounded-2xl"
            onClick={() => onRouteChange(key)}
          >
            {routes[key].icon}
            {routes[key].label}
          </Button>
        );
      })}
    </nav>
  );
}

export function AppShell({ route, onRouteChange, darkMode, onDarkModeChange, onLogout }: AppShellProps) {
  React.useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ route?: RouteKey; cardId?: string; dueMonth?: string }>;
      const nextRoute = custom.detail?.route;
      if (!nextRoute) {
        return;
      }

      if (custom.detail?.cardId && custom.detail?.dueMonth) {
        sessionStorage.setItem(
          "cards:navigation-context",
          JSON.stringify({ cardId: custom.detail.cardId, dueMonth: custom.detail.dueMonth }),
        );
      }

      onRouteChange(nextRoute);
    };

    window.addEventListener("app:navigate-route", handler);
    return () => window.removeEventListener("app:navigate-route", handler);
  }, [onRouteChange]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[300px_1fr]">
      <aside className="hidden border-r border-slate-200/80 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-[#090f13]/80 lg:block">
        <Card className="h-full section-reveal">
          <CardHeader>
            <Badge variant="lime" className="w-fit">
              Our Home
            </Badge>
            <CardTitle className="text-2xl">Money Finesse</CardTitle>
            <CardDescription>Controle diario no mobile com saldo livre e risco explicavel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <NavItems route={route} onRouteChange={onRouteChange} />
            <Separator />
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              aria-label="Alternar tema"
              onClick={() => onDarkModeChange(!darkMode)}
            >
              {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              {darkMode ? "Modo claro" : "Modo escuro"}
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={onLogout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </aside>

      <main className="safe-bottom p-3 pb-24 pt-4 lg:p-8 lg:pb-8">
        <header className="surface-card section-reveal mb-4 flex items-center justify-between px-3 py-2 lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Our Home</SheetTitle>
                <SheetDescription>Navegacao principal</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {(Object.keys(routes) as RouteKey[]).map((key) => {
                  const active = key === route;
                  return (
                    <SheetClose asChild key={key}>
                      <Button
                        type="button"
                        variant={active ? "lime" : "secondary"}
                        className="h-11 w-full justify-start rounded-2xl"
                        onClick={() => onRouteChange(key)}
                      >
                        {routes[key].icon}
                        {routes[key].label}
                      </Button>
                    </SheetClose>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          <div className="text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-300">Hoje</p>
            <p className="font-display text-sm">{routes[route].label}</p>
          </div>

          <div className="flex items-center gap-1">
            {route === "cashflow" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Novo lancamento"
                onClick={() => window.dispatchEvent(new CustomEvent("cashflow:new-launch"))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Alternar tema"
              onClick={() => onDarkModeChange(!darkMode)}
            >
              {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Sair" onClick={onLogout}>
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <header className="mb-6 hidden items-center justify-between lg:flex">
          <div className="stagger-up">
            <h2 className="text-3xl">{routes[route].label}</h2>
          </div>
          <div className="flex items-center gap-2">
            {route === "cashflow" ? (
              <Button type="button" aria-label="Novo lancamento" onClick={() => window.dispatchEvent(new CustomEvent("cashflow:new-launch"))}>
                Novo lancamento
              </Button>
            ) : null}
            <Button type="button" variant="secondary" size="icon" aria-label="Alternar tema" onClick={() => onDarkModeChange(!darkMode)}>
              {darkMode ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
            </Button>
            <Button type="button" variant="ghost" aria-label="Sair" onClick={onLogout}>
              Sair
            </Button>
          </div>
        </header>

        <section className="section-reveal space-y-4">{routes[route].render()}</section>

        <div className="mobile-bottom-nav lg:hidden">
          <Tabs value={route} onValueChange={(value) => onRouteChange(value as RouteKey)}>
            <TabsList className="grid h-14 w-full grid-cols-4 rounded-2xl">
              {quickRoutes.map((key) => (
                <TabsTrigger key={key} value={key} className="flex h-11 flex-col gap-0.5 px-1 text-[11px]">
                  {routes[key].icon}
                  {routes[key].shortLabel}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
