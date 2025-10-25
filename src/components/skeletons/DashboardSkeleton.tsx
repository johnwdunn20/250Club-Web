import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32 sm:h-9 sm:w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs skeleton */}
        <div className="flex justify-center mb-8">
          <div className="w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-96" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          {/* Card skeleton */}
          <div className="card-mobile">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-full mb-6" />

            {/* Exercise cards grid skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>

            {/* Progress bar skeleton */}
            <Skeleton className="h-3 w-full mb-6" />

            {/* Button skeleton */}
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </main>
    </div>
  )
}
