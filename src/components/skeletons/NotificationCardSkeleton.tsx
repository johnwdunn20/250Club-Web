import { Skeleton } from "@/components/ui/skeleton"

export function NotificationCardSkeleton() {
  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0" />
      </div>
    </div>
  )
}

export function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <NotificationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
