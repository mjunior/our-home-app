import { AlertTriangle, ChevronDown, Info, ShieldAlert } from "lucide-react";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

import type { FreeBalanceAlert as AlertItem, FreeBalanceConfidence } from "../../modules/free-balance/free-balance.types";

interface FreeBalanceAlertProps {
  alerts: AlertItem[];
  confidence: FreeBalanceConfidence;
  missingData: string[];
}

const tone = {
  info: {
    className: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40",
    icon: <Info className="h-4 w-4" />,
  },
  warning: {
    className: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  danger: {
    className: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
};

export function FreeBalanceAlert({ alerts, confidence, missingData }: FreeBalanceAlertProps) {
  return (
    <Card aria-label="Alertas saldo livre" className="section-reveal">
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle>Alertas e Sugestoes</CardTitle>
        <Badge variant={confidence === "LOW" ? "destructive" : "secondary"}>{confidence === "LOW" ? "Baixa confianca" : "Confiavel"}</Badge>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {alerts.map((alert, index) => (
          <details
            key={`${alert.title}-${index}`}
            data-testid={`free-balance-alert-${alert.level}`}
            className={`group rounded-2xl border ${tone[alert.level].className}`}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
              <h3 className="flex items-center gap-2 text-sm font-bold">
                {tone[alert.level].icon}
                {alert.title}
              </h3>
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </summary>
            <div className="border-t border-black/10 px-3 pb-3 pt-2 dark:border-white/10">
              <p className="text-sm">{alert.message}</p>
              {alert.suggestions.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {alert.suggestions.map((suggestion) => (
                    <li key={suggestion}>{suggestion}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </details>
        ))}

        {confidence === "LOW" ? (
          <p
            data-testid="free-balance-confidence-low"
            className="rounded-xl border border-dashed border-amber-500/50 bg-amber-100/70 p-2 text-sm dark:bg-amber-900/30"
          >
            Projecao com baixa confiabilidade. Pendencias: {missingData.join(" | ")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
