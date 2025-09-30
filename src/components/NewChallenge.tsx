export default function NewChallenge() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-mobile">
        <h2 className="text-2xl font-bold text-foreground mb-2">Create a Challenge</h2>
        <p className="text-muted-foreground mb-6">
          Challenge yourself or your friends to reach new fitness goals
        </p>

        {/* Challenge form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Challenge Name
            </label>
            <input
              type="text"
              placeholder="e.g., Weekend Warrior"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Reps
            </label>
            <input
              type="number"
              placeholder="250"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Duration (days)
            </label>
            <input
              type="number"
              placeholder="7"
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Challenge Type
            </label>
            <select className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground">
              <option>Solo Challenge</option>
              <option>Friend Challenge</option>
              <option>Group Challenge</option>
            </select>
          </div>

          <button className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 mt-6">
            Create Challenge
          </button>
        </div>
      </div>

      {/* Active challenges */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">Active Challenges</h3>
        <div className="space-y-3">
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-foreground">No active challenges</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Create your first challenge to get started!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}