import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Clamp confidence to [0, 100] and format with 1 decimal place */
export function formatConfidence(value: number): string {
  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`
}

/** Tailwind text color class based on confidence percentage: red → orange → yellow → green */
export function confidenceColor(value: number): string {
  const clamped = Math.min(100, Math.max(0, value))
  if (clamped >= 80) return 'text-chart-2'       // gruen
  if (clamped >= 60) return 'text-yellow-500'     // gelb
  if (clamped >= 40) return 'text-orange-500'     // orange
  return 'text-destructive'                       // rot
}
