"use client"

interface StreakCardProps {
  currentStreak: number
  longestStreak?: number
}

export default function StreakCard({
  currentStreak,
  longestStreak,
}: StreakCardProps) {
  return (
    <div className="card-mobile bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm text-muted-foreground mb-1">
            Current Streak
          </div>
          <div className="text-4xl font-bold text-foreground">
            {currentStreak} {currentStreak === 1 ? "day" : "days"}
          </div>
          {longestStreak !== undefined && longestStreak > 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              Best: {longestStreak} {longestStreak === 1 ? "day" : "days"}
            </div>
          )}
        </div>
        <div className="text-6xl">
          {currentStreak >= 7 ? "🏆" : currentStreak >= 3 ? "🔥" : "💪"}
        </div>
      </div>
      {currentStreak > 0 && (
        <div className="mt-4 text-sm text-primary font-medium">
          {currentStreak >= 7
            ? "Amazing! You're on fire!"
            : currentStreak >= 3
              ? "Great work! Keep it up!"
              : "Good start! Build that streak!"}
        </div>
      )}
    </div>
  )
}
