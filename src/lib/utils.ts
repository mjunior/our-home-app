import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrencyBR(value: string | number): string {
  const numeric = typeof value === "number" ? value : Number(value);
  return currencyFormatter.format(Number.isNaN(numeric) ? 0 : numeric);
}

export function formatDateBR(isoDateLike: string): string {
  const [year, month, day] = isoDateLike.slice(0, 10).split("-");
  if (!year || !month || !day) {
    return isoDateLike;
  }

  return `${day}/${month}/${year}`;
}

export function formatCurrencyInputBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cents = Number(digits || "0");
  const amount = cents / 100;
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function currencyInputToDecimal(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const cents = Number(digits || "0");
  return (cents / 100).toFixed(2);
}
