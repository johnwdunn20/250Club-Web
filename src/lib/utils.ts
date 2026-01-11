import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get user's timezone string (e.g., 'America/New_York')
 * This is used when calling Convex functions that need timezone info
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Get today's date in YYYY-MM-DD format using user's local timezone
 * Uses Intl.DateTimeFormat for consistent formatting across browsers
 */
export function getTodayDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getUserTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

/**
 * Get a date string with offset days from today (user's timezone)
 * @param daysOffset - Number of days to offset (positive for future, negative for past)
 */
export function getDateString(daysOffset: number = 0): string {
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + daysOffset)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: getUserTimezone(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(targetDate)
}

/**
 * Get tomorrow's date in YYYY-MM-DD format (user's timezone)
 */
export function getTomorrowDate(): string {
  return getDateString(1)
}

/**
 * Format a date string for display
 * @param dateStr - Date in YYYY-MM-DD format
 * @param options - Intl.DateTimeFormat options
 */
export function formatDateDisplay(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString(
    "en-US",
    options || { weekday: "long", month: "long", day: "numeric" }
  )
}

/**
 * Check if a date is today
 * @param dateStr - Date in YYYY-MM-DD format
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDate()
}

/**
 * Check if a date is in the past
 * @param dateStr - Date in YYYY-MM-DD format
 */
export function isPastDate(dateStr: string): boolean {
  return dateStr < getTodayDate()
}

/**
 * Check if a date is in the future
 * @param dateStr - Date in YYYY-MM-DD format
 */
export function isFutureDate(dateStr: string): boolean {
  return dateStr > getTodayDate()
}

/**
 * Format a date string for display with relative labels (Today, Tomorrow)
 * @param dateStr - Date in YYYY-MM-DD format
 */
export function formatDateDisplayWithRelative(dateStr: string): string {
  const today = getTodayDate()
  const date = new Date(dateStr + "T00:00:00")

  if (dateStr === today) {
    return `Today (${date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })})`
  }

  const tomorrow = getDateString(1)
  if (dateStr === tomorrow) {
    return `Tomorrow (${date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })})`
  }

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}
