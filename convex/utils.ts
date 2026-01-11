import { QueryCtx, MutationCtx } from "./_generated/server"

/**
 * Get the current authenticated user from the database.
 * Throws an error if the user is not authenticated or not found in the database.
 */
export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", q =>
      q.eq("tokenIdentifier", identity.tokenIdentifier)
    )
    .unique()

  if (!user) {
    throw new Error("User not found")
  }

  return user
}

/**
 * Get today's date in YYYY-MM-DD format (user's timezone)
 * @param timezone - User's timezone (e.g., 'America/New_York')
 */
export function getTodayDateFromTimezone(timezone: string): string {
  const now = new Date()
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

/**
 * Get tomorrow's date in YYYY-MM-DD format (user's timezone)
 * Uses setDate() instead of adding milliseconds to handle DST transitions correctly.
 * @param timezone - User's timezone (e.g., 'America/New_York')
 */
export function getTomorrowDateFromTimezone(timezone: string): string {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow)
}

/**
 * Get a date string with offset days from today (user's timezone)
 * Uses setDate() instead of adding milliseconds to handle DST transitions correctly.
 * @param timezone - User's timezone (e.g., 'America/New_York')
 * @param daysOffset - Number of days to offset (positive for future, negative for past)
 */
export function getDateStringFromTimezone(
  timezone: string,
  daysOffset: number = 0
): string {
  const now = new Date()
  const targetDate = new Date(now)
  targetDate.setDate(targetDate.getDate() + daysOffset)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(targetDate)
}
