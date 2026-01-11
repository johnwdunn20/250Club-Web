"use client"

import type { UserChallenges } from "@/types/convex"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import { formatDateDisplayWithRelative, getTodayDate } from "@/lib/utils"

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
      <div className="card-mobile">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-3 bg-muted/30 rounded-lg">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Filter to only show upcoming challenges (date > today)
  const today = getTodayDate()
  const upcomingChallenges = userChallenges
    .filter(challenge => challenge.date > today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3) // Show max 3 upcoming challenges

  // Empty state - no upcoming challenges
  if (upcomingChallenges.length === 0) {
    return (
      <div className="card-mobile">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">📅</span>
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
        <span className="text-xl">📅</span>
        Upcoming Challenges
      </h3>

      <div className="space-y-3">
        {upcomingChallenges.map(challenge => (
          <div
            key={challenge._id}
            className="p-3 bg-muted/30 rounded-lg border border-border"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground truncate">
                  {challenge.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDateDisplayWithRelative(challenge.date)}
                </div>
              </div>
              <div className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                {challenge.exercises.length} exercises
              </div>
            </div>
            {challenge.participantCount > 1 && (
              <div className="mt-2 text-xs text-primary">
                {challenge.participantCount} participants
              </div>
            )}
          </div>
        ))}
      </div>

      {onNavigateToTab && (
        <div className="mt-4 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab("challenge")}
            className="w-full text-xs text-muted-foreground"
          >
            View All Challenges →
          </Button>
        </div>
      )}
    </div>
  )
}
