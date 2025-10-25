import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-8 w-24 shrink-0" />
      </div>
    </Card>
  );
}

export function NotificationsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <NotificationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
