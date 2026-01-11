"use client"

import type { WeeklyProgress } from "@/types/convex"

interface WeeklyProgressCardProps {
  weeklyProgress: WeeklyProgress | undefined
}

export default function WeeklyProgressCard({
  weeklyProgress,
}: WeeklyProgressCardProps) {
  // Loading state
  if (weeklyProgress === undefined) {
    return (
      <div className="card-mobile animate-pulse">
        <div className="h-5 bg-muted rounded w-40 mb-4"></div>
        <div className="flex justify-between gap-1 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="h-3 w-6 bg-muted rounded"></div>
              <div className="w-8 h-8 rounded-full bg-muted"></div>
            </div>
          ))}
        </div>
        <div className="h-4 bg-muted rounded w-32"></div>
      </div>
    )
  }

  const { daysWithChallenges, completedChallengesThisWeek } = weeklyProgress

  // Get day abbreviations
  const getDayAbbr = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)
  }

  // Check if date is today
  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateStr === today
  }

  // Check if date is in the past
  const isPast = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0]
    return dateStr < today
  }

  // Count days with completed challenges
  const completedDays = daysWithChallenges.filter(
    d => d.isCompleted && d.challengeCount > 0
  ).length
  const daysWithAnyChallenges = daysWithChallenges.filter(
    d => d.challengeCount > 0
  ).length

  return (
    <div className="card-mobile">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-xl">📅</span>
        This Week
      </h3>

      {/* Weekly calendar view */}
      <div className="flex justify-between gap-1 mb-4">
        {daysWithChallenges.map(day => {
          const hasChallenge = day.challengeCount > 0
          const isComplete = day.isCompleted
          const dayIsToday = isToday(day.date)
          const dayIsPast = isPast(day.date)

          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs text-muted-foreground font-medium">
                {getDayAbbr(day.date)}
              </span>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  hasChallenge && isComplete
                    ? "bg-green-500 text-white"
                    : hasChallenge && dayIsPast
                      ? "bg-red-500/20 text-red-600 border-2 border-red-500/30"
                      : hasChallenge
                        ? "bg-primary/20 text-primary border-2 border-primary/30"
                        : dayIsToday
                          ? "bg-muted border-2 border-primary/50"
                          : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {hasChallenge && isComplete ? (
                  "✓"
                ) : hasChallenge ? (
                  day.challengeCount
                ) : (
                  <span className="text-xs">-</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary text */}
      <div className="text-sm text-muted-foreground">
        {daysWithAnyChallenges === 0 ? (
          <p>No challenges scheduled this week yet</p>
        ) : (
          <p>
            <span className="font-medium text-foreground">
              {completedDays}/{daysWithAnyChallenges}
            </span>{" "}
            challenge days completed
            {completedChallengesThisWeek > 0 && (
              <span className="text-green-600 ml-2">
                ({completedChallengesThisWeek} total)
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
