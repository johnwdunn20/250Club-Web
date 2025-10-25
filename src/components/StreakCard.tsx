"use client"

interface StreakCardProps {
  currentStreak: number
}

export default function StreakCard({ currentStreak }: StreakCardProps) {
  return (
    <div className="card-mobile bg-gradient-to-br from-primary/10 to-accent/10">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground mb-1">
            Current Streak
          </div>
          <div className="text-4xl font-bold text-foreground">
            {currentStreak} {currentStreak === 1 ? "day" : "days"}
          </div>
        </div>
        <div className="text-6xl">🔥</div>
      </div>
    </div>
  )
}
