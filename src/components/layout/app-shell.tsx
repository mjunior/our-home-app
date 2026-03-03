import React from "react";
import { Menu, MoonStar, SunMedium } from "lucide-react";

import type { RouteKey } from "../../app/routes";
import { routes } from "../../app/routes";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";

interface AppShellProps {
  route: RouteKey;
  onRouteChange: (next: RouteKey) => void;
  darkMode: boolean;
  onDarkModeChange: (value: boolean) => void;
}

function NavItems({ route, onRouteChange }: { route: RouteKey; onRouteChange: (next: RouteKey) => void }) {
  return (
    <nav className="space-y-2">
      {(Object.keys(routes) as RouteKey[]).map((key) => {
        const active = key === route;
        return (
          <Button
            key={key}
            type="button"
            variant={active ? "lime" : "secondary"}
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

export function AppShell({ route, onRouteChange, darkMode, onDarkModeChange }: AppShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="hidden border-r border-slate-200/80 bg-white/90 p-4 backdrop-blur dark:border-slate-800 dark:bg-[#0b1014]/95 lg:block">
        <Card className="h-full">
          <CardHeader>
            <Badge variant="lime" className="w-fit uppercase tracking-[0.18em]">Our Home</Badge>
            <CardTitle className="text-2xl">Money Finesse</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-300">Controle diario no mobile, com previsao clara.</p>
          </CardHeader>
          <CardContent>
            <NavItems route={route} onRouteChange={onRouteChange} />
          </CardContent>
        </Card>
      </aside>

      <main className="p-3 pb-8 pt-4 lg:p-8">
        <header className="panel mb-4 flex items-center justify-between lg:hidden">
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

          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{routes[route].shortLabel}</p>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Alternar tema"
            onClick={() => onDarkModeChange(!darkMode)}
          >
            {darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
        </header>

        <header className="hidden items-center justify-between pb-5 lg:flex">
          <div>
            <Badge variant="outline" className="mb-2 uppercase tracking-[0.12em]">mobile-first financial cockpit</Badge>
            <h2 className="text-3xl">{routes[route].label}</h2>
          </div>
          <Button type="button" variant="secondary" size="icon" aria-label="Alternar tema" onClick={() => onDarkModeChange(!darkMode)}>
            {darkMode ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </Button>
        </header>

        <div className="mb-4 lg:hidden">
          <Tabs value={route} onValueChange={(v) => onRouteChange(v as RouteKey)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cashflow">Caixa</TabsTrigger>
              <TabsTrigger value="accounts">Contas</TabsTrigger>
              <TabsTrigger value="cards">Cartoes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Separator className="mb-4" />
        <section className="space-y-4">{routes[route].render()}</section>
      </main>
    </div>
  );
}
