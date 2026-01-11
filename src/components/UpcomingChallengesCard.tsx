"use client"

import type { UserChallenges } from "@/types/convex"
import { Button } from "./ui/button"

interface UpcomingChallengesCardProps {
  userChallenges: UserChallenges | undefined
  onNavigateToTab?: (tab: string) => void
}

export default function UpcomingChallengesCard({
  userChallenges,
  onNavigateToTab,
}: UpcomingChallengesCardProps) {
  // Loading state
  if (userChallenges === undefined) {
    return (
      <div className="card-mobile animate-pulse">
        <div className="h-5 bg-muted rounded w-48 mb-4"></div>
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-3 bg-muted/30 rounded-lg">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Get today's date
  const today = new Date().toISOString().split("T")[0]

  // Filter for upcoming challenges (future dates only)
  const upcomingChallenges = userChallenges
    .filter(
      challenge => challenge.date > today && challenge.userStatus === "active"
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3)

  // Format date display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)

    const dateOnly = date.toISOString().split("T")[0]
    const tomorrowOnly = tomorrow.toISOString().split("T")[0]

    if (dateOnly === tomorrowOnly) {
      return "Tomorrow"
    }

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  // Calculate days until
  const daysUntil = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00")
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (upcomingChallenges.length === 0) {
    return (
      <div className="card-mobile">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">🎯</span>
          Upcoming Challenges
        </h3>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No upcoming challenges scheduled
          </p>
          {onNavigateToTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab("challenge")}
            >
              Schedule a Challenge
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card-mobile">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-xl">🎯</span>
        Upcoming Challenges
      </h3>

      <div className="space-y-3">
        {upcomingChallenges.map(challenge => {
          const days = daysUntil(challenge.date)

          return (
            <div
              key={challenge._id}
              className="p-3 bg-muted/30 rounded-lg border border-border"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">
                    {challenge.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(challenge.date)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {challenge.exercises.length} exercises •{" "}
                    {challenge.participantCount} participants
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      days === 1
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {days === 1 ? "Tomorrow" : `${days} days`}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {userChallenges.filter(c => c.date > today).length > 3 && (
        <div className="mt-3 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab?.("challenge")}
            className="text-xs text-muted-foreground"
          >
            View all challenges →
          </Button>
        </div>
      )}
    </div>
  )
}
