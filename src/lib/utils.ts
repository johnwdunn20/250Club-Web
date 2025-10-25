import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get today's date in YYYY-MM-DD format (user's timezone)
 */
export function getTodayDate(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split("T")[0]
}

/**
 * Get tomorrow's date in YYYY-MM-DD format (user's timezone)
 */
export function getTomorrowDate(): string {
  const now = new Date()
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )
  return tomorrow.toISOString().split("T")[0]
}

/**
 * Get a date string with offset days from today (user's timezone)
 * @param daysOffset - Number of days to offset (positive for future, negative for past)
 */
export function getDateString(daysOffset: number = 0): string {
  const now = new Date()
  const date = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysOffset
  )
  return date.toISOString().split("T")[0]
}

/**
 * Get user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}
