export default function TodaysWorkout() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-mobile">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Today's Challenge</h2>
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
            0 / 250
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          Complete 250 reps to maintain your streak
        </p>

        {/* Workout stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/10 rounded-lg">
            <div className="text-3xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted-foreground mt-1">Push-ups</div>
          </div>
          <div className="text-center p-4 bg-accent/10 rounded-lg">
            <div className="text-3xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted-foreground mt-1">Squats</div>
          </div>
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <div className="text-3xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted-foreground mt-1">Sit-ups</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-3xl font-bold text-foreground">0</div>
            <div className="text-sm text-muted-foreground mt-1">Other</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Progress</span>
            <span>0%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95">
            Log Workout
          </button>
          <button className="px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-accent/10 transition-all">
            View History
          </button>
        </div>
      </div>

      {/* Current streak card */}
      <div className="card-mobile bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Current Streak</div>
            <div className="text-4xl font-bold text-foreground">0 days</div>
          </div>
          <div className="text-6xl">🔥</div>
        </div>
      </div>
    </div>
  );
}