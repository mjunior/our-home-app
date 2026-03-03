import React from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";

import { cn } from "../../lib/utils";

type SnackbarTone = "success" | "error" | "info";

interface SnackbarPayload {
  message: string;
  tone?: SnackbarTone;
}

interface SnackbarItem {
  id: string;
  message: string;
  tone: SnackbarTone;
}

interface SnackbarContextValue {
  notify: (payload: SnackbarPayload) => void;
}

const SnackbarContext = React.createContext<SnackbarContextValue | null>(null);

const toneStyles: Record<SnackbarTone, string> = {
  success: "border-emerald-300/60 bg-emerald-500/90 text-white",
  error: "border-red-300/60 bg-red-500/92 text-white",
  info: "border-brand-teal/60 bg-brand-teal/92 text-white",
};

const toneIcons: Record<SnackbarTone, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
};

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<SnackbarItem[]>([]);

  const notify = React.useCallback(({ message, tone = "success" }: SnackbarPayload) => {
    const id = createId();
    const next: SnackbarItem = { id, message, tone };

    setItems((prev) => [...prev.slice(-2), next]);

    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  return (
    <SnackbarContext.Provider value={{ notify }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] mx-auto flex w-full max-w-xl flex-col gap-2 px-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "snackbar-in pointer-events-auto rounded-2xl border px-3 py-2 text-sm font-semibold shadow-soft backdrop-blur",
              toneStyles[item.tone],
            )}
          >
            <div className="flex items-center gap-2">
              {toneIcons[item.tone]}
              <span>{item.message}</span>
            </div>
          </div>
        ))}
      </div>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const context = React.useContext(SnackbarContext);

  if (!context) {
    return {
      notify: () => {
        // no-op fallback for isolated renders (e.g. tests without provider)
      },
    };
  }

  return context;
}
