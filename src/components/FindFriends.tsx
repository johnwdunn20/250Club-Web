export default function FindFriends() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-mobile">
        <h2 className="text-2xl font-bold text-foreground mb-2">Find Friends</h2>
        <p className="text-muted-foreground mb-6">
          Connect with friends and workout together
        </p>

        {/* Search bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search by username or email..."
            className="w-full px-4 py-3 pl-10 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Invite link */}
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Your Invite Link</span>
            <button className="text-sm text-primary font-semibold hover:underline">
              Copy
            </button>
          </div>
          <div className="text-sm text-muted-foreground font-mono truncate">
            250club.app/invite/abc123xyz
          </div>
        </div>

        <button className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg">
          Share Invite Link
        </button>
      </div>

      {/* Friends list */}
      <div className="card-mobile">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Your Friends</h3>
          <span className="text-sm text-muted-foreground">0 friends</span>
        </div>

        <div className="space-y-3">
          <div className="p-6 bg-muted/30 rounded-lg border border-border text-center">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-sm text-muted-foreground">
              No friends yet. Invite your friends to join!
            </p>
          </div>
        </div>
      </div>

      {/* Pending requests */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">Pending Requests</h3>
        <div className="space-y-3">
          <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
            <p className="text-sm text-muted-foreground">
              No pending friend requests
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}