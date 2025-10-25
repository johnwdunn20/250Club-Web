import { Skeleton } from "@/components/ui/skeleton"

export function UserListItemSkeleton() {
  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  )
}

export function FriendRequestItemSkeleton() {
  return (
    <div className="p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 flex-1" />
      </div>
    </div>
  )
}

export function FriendsListSkeleton() {
  return (
    <div className="card-mobile">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <UserListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function PendingRequestsSkeleton() {
  return (
    <div className="card-mobile">
      <Skeleton className="h-7 w-40 mb-4" />
      <div className="space-y-3">
        {[1, 2].map(i => (
          <FriendRequestItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function SentRequestsSkeleton() {
  return (
    <div className="card-mobile">
      <Skeleton className="h-7 w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2].map(i => (
          <UserListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
