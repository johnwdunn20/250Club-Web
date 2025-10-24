import { SignInButton } from "@clerk/nextjs";
import { ThemeToggle } from "./ThemeToggle";

export default function SplashPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-accent/30 px-4 relative overflow-hidden">
      {/* Theme toggle in corner */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
        {/* Header section */}
        <div className="space-y-6">
          <div className="inline-block animate-fade-in">
            <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-semibold text-sm mb-6">
              Daily Fitness Challenge
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in-up">
            <span className="text-foreground">Welcome to</span>{" "}
            <span
              className="block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient"
              style={{ backgroundSize: "200% 200%" }}
            >
              250 Club
            </span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-medium animate-fade-in-up delay-200">
            Your daily workout challenge
          </p>
        </div>

        {/* Features section */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 animate-fade-in-up delay-300">
          <div className="card-mobile bg-card/50 backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all hover:scale-105">
            <div className="text-4xl mb-3">💪</div>
            <h3 className="font-semibold text-foreground mb-2">Daily Goals</h3>
            <p className="text-sm text-muted-foreground">
              Hit your 250 rep target every day
            </p>
          </div>

          <div className="card-mobile bg-card/50 backdrop-blur-sm border-accent/20 hover:border-accent/40 transition-all hover:scale-105">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-foreground mb-2">
              Track Progress
            </h3>
            <p className="text-sm text-muted-foreground">
              Monitor your streak and achievements
            </p>
          </div>

          <div className="card-mobile bg-card/50 backdrop-blur-sm border-secondary/20 hover:border-secondary/40 transition-all hover:scale-105">
            <div className="text-4xl mb-3">🏆</div>
            <h3 className="font-semibold text-foreground mb-2">
              Stay Motivated
            </h3>
            <p className="text-sm text-muted-foreground">
              Join a community of champions
            </p>
          </div>
        </div>

        {/* CTA section */}
        <div className="pt-8 animate-fade-in-up delay-500">
          <SignInButton mode="modal">
            <button className="group relative px-10 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95">
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-20 rounded-lg transition-opacity" />
            </button>
          </SignInButton>
          <p className="mt-4 text-sm text-muted-foreground">
            Free to join • Start your journey today
          </p>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
    </div>
  );
}
