import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCops(centsOrPesos: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(centsOrPesos);
}

export function tableUrl(slug: string, tableCode: string, base?: string): string {
  const root = base || process.env.NEXT_PUBLIC_APP_URL || "";
  return `${root}/r/${slug}/m/${tableCode}`;
}
