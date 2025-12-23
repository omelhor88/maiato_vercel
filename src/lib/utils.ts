import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeNif(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

