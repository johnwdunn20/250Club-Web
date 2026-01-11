"use client"

import type { WeeklyProgress } from "@/types/convex"
import { Skeleton } from "./ui/skeleton"
import { getTodayDate } from "@/lib/utils"

interface WeeklyProgressCardProps {
  weeklyProgress: WeeklyProgress | undefined
}

// Helper to format day of week
function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

// Helper for day indicator styling - avoids complex nested ternaries
function getDayIndicatorClasses(
  isCompleted: boolean,
  hasChallenges: boolean,
  isPast: boolean,
  isToday: boolean
): string {
  if (isCompleted) return "bg-green-500 text-white"
  if (hasChallenges && isPast) return "bg-destructive/20 text-destructive"
  if (hasChallenges) return "bg-primary/20 text-primary"
  if (isToday) return "border-2 border-primary/50 text-muted-foreground"
  return "bg-muted/30 text-muted-foreground"
}

export default function WeeklyProgressCard({
  weeklyProgress,
}: WeeklyProgressCardProps) {
  // Loading state
  if (weeklyProgress === undefined) {
    return (
      <div className="card-mobile">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="flex justify-between gap-1 mb-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <Skeleton className="h-3 w-6" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-48" />
      </div>
    )
  }

  // Empty state - no challenges this week
  if (weeklyProgress.totalChallengesThisWeek === 0) {
    return (
      <div className="card-mobile">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">📊</span>
          This Week
        </h3>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">
            No challenges scheduled this week yet
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card-mobile">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-xl">📊</span>
        This Week
      </h3>

      {/* Weekly calendar view */}
      {(() => {
        const today = getTodayDate()
        return (
          <div className="flex justify-between gap-1 mb-4">
            {weeklyProgress.daysWithChallenges.map(day => {
              const isToday = day.date === today
              const isPast = day.date < today
              const hasChallenges = day.challengeCount > 0

              return (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {getDayLabel(day.date)}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${getDayIndicatorClasses(
                      day.isCompleted,
                      hasChallenges,
                      isPast,
                      isToday
                    )}`}
                  >
                    {day.isCompleted
                      ? "✓"
                      : day.challengeCount > 0
                        ? day.challengeCount
                        : "·"}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* Summary stats */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {weeklyProgress.completedChallengesThisWeek} /{" "}
          {weeklyProgress.totalChallengesThisWeek} completed
        </span>
        <span
          className={`font-semibold ${
            weeklyProgress.completedChallengesThisWeek ===
            weeklyProgress.totalChallengesThisWeek
              ? "text-green-600"
              : "text-primary"
          }`}
        >
          {weeklyProgress.totalChallengesThisWeek > 0
            ? Math.round(
                (weeklyProgress.completedChallengesThisWeek /
                  weeklyProgress.totalChallengesThisWeek) *
                  100
              )
            : 0}
          %
        </span>
      </div>
    </div>
  )
}
