import { CheckCircle2, MinusCircle } from "lucide-react";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { formatCurrencyBR, formatDateBR, formatMonthLabelBR } from "../../lib/utils";
import type { MonthClosePreview } from "../../modules/month-close/month-close.service";

interface MonthCloseSheetProps {
  open: boolean;
  preview: MonthClosePreview | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountChange: (accountId: string, value: string) => void;
  onConfirm: () => void;
}

function resultBadgeLabel(willCreateAdjustment: boolean) {
  return willCreateAdjustment ? "Ajuste" : "Sem ajuste";
}

export function MonthCloseSheet({
  open,
  preview,
  isSubmitting,
  onOpenChange,
  onAccountChange,
  onConfirm,
}: MonthCloseSheetProps) {
  const accountAdjustments = preview?.accounts.filter((row) => row.willCreateAdjustment).length ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="inset-y-auto left-1/2 top-1/2 h-auto max-h-[90vh] w-[94%] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl border-r-0">
        <SheetHeader>
          <SheetTitle>Fechar mes</SheetTitle>
          <SheetDescription>Conferir contas correntes do mes antes de registrar os reajustes.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {preview ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{formatMonthLabelBR(preview.month)}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-300">Data do ajuste</span>
                  <strong>{formatDateBR(preview.adjustmentDate)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-500 dark:text-slate-300">Contas com ajuste</span>
                  <strong>{accountAdjustments}</strong>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Contas correntes</h3>
              <Badge variant="secondary">{preview?.accounts.length ?? 0}</Badge>
            </div>
            <div className="space-y-3">
              {preview?.accounts.length ? (
                preview.accounts.map((row) => (
                  <Card key={row.accountId}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{row.accountName}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-300">Saldo no app: {formatCurrencyBR(row.appBalance)}</p>
                        </div>
                        <Badge variant={row.willCreateAdjustment ? "default" : "outline"}>{resultBadgeLabel(row.willCreateAdjustment)}</Badge>
                      </div>

                      <label className="grid gap-1 text-sm">
                        <span className="font-medium text-slate-700 dark:text-slate-200">Valor real</span>
                        <input
                          aria-label={`Valor real - ${row.accountName}`}
                          inputMode="decimal"
                          value={row.realBalance}
                          onChange={(event) => onAccountChange(row.accountId, event.target.value)}
                          className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-brand-teal dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                      </label>

                      <Separator />

                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-300">Diferenca</span>
                        <strong className={row.willCreateAdjustment ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-300"}>
                          {formatCurrencyBR(row.difference)}
                        </strong>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">Nenhuma conta corrente entrou no fechamento deste mes.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Fechando...
                </>
              ) : (
                <>
                  <MinusCircle className="h-4 w-4" />
                  Confirmar fechamento
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
