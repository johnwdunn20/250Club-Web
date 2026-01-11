"use client"

import type { FriendActivity } from "@/types/convex"
import { Button } from "./ui/button"
import { Skeleton } from "./ui/skeleton"
import { formatTimestampRelative } from "@/lib/utils"

interface FriendActivityCardProps {
  friendActivity: FriendActivity[] | undefined
  onNavigateToTab?: (tab: string) => void
}

export default function FriendActivityCard({
  friendActivity,
  onNavigateToTab,
}: FriendActivityCardProps) {
  // Loading state
  if (friendActivity === undefined) {
    return (
      <div className="card-mobile">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Empty state - no friends or no activity
  if (friendActivity.length === 0) {
    return (
      <div className="card-mobile">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">👥</span>
          Friend Activity
        </h3>
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            No recent activity from friends
          </p>
          {onNavigateToTab && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToTab("friends")}
            >
              Find Friends
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="card-mobile">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <span className="text-xl">👥</span>
        Friend Activity
      </h3>

      <div className="space-y-3">
        {friendActivity.map((activity, index) => (
          <div
            key={`${activity.friendId}-${activity.challengeId}-${index}`}
            className="flex items-start gap-3"
          >
            {/* Avatar placeholder */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                activity.completionPercentage === 100
                  ? "bg-green-500 text-white"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {activity.completionPercentage === 100
                ? "✓"
                : activity.friendName.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium text-foreground">
                  {activity.friendName}
                </span>
                {activity.completionPercentage === 100 ? (
                  <span className="text-muted-foreground">
                    {" "}
                    completed{" "}
                    <span className="font-medium text-foreground">
                      {activity.challengeName}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    {" "}
                    is {activity.completionPercentage}% through{" "}
                    <span className="font-medium text-foreground">
                      {activity.challengeName}
                    </span>
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {activity.isToday && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                    Today
                  </span>
                )}
                {activity.completedAt && (
                  <span>{formatTimestampRelative(activity.completedAt)}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {onNavigateToTab && (
        <div className="mt-4 pt-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigateToTab("friends")}
            className="w-full text-xs text-muted-foreground"
          >
            Manage Friends →
          </Button>
        </div>
      )}
    </div>
  )
}
