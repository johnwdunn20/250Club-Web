"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import type { Notifications } from "@/types/convex"
import { NotificationsLoadingSkeleton } from "./skeletons/NotificationCardSkeleton"
import { toast } from "sonner"

interface NotificationsProps {
  notifications: Notifications | undefined
}

// Helper to format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: days > 365 ? "numeric" : undefined,
    })
  } else if (days > 0) {
    return `${days}d ago`
  } else if (hours > 0) {
    return `${hours}h ago`
  } else if (minutes > 0) {
    return `${minutes}m ago`
  } else {
    return "Just now"
  }
}

// Helper to get notification icon based on content
function getNotificationIcon(message: string): string {
  if (message.includes("friend request") || message.includes("accepted")) {
    return "👥"
  } else if (message.includes("challenge") || message.includes("invitation")) {
    return "🎯"
  } else if (message.includes("completed") || message.includes("streak")) {
    return "🏆"
  } else if (message.includes("declined") || message.includes("left")) {
    return "👋"
  }
  return "🔔"
}

export default function Notifications({ notifications }: NotificationsProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)
  const clearAllNotifications = useMutation(
    api.notifications.clearAllNotifications
  )

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    setLoadingId(`read-${notificationId}`)
    try {
      await markAsRead({ notificationId })
    } catch (error) {
      console.error("Failed to mark as read:", error)
      toast.error("Failed to mark notification as read")
    } finally {
      setLoadingId(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    setIsMarkingAllRead(true)
    try {
      await markAllAsRead({})
      toast.success("All notifications marked as read")
    } catch (error) {
      console.error("Failed to mark all as read:", error)
      toast.error("Failed to mark all as read")
    } finally {
      setIsMarkingAllRead(false)
    }
  }

  const handleDelete = async (notificationId: Id<"notifications">) => {
    setLoadingId(`delete-${notificationId}`)
    try {
      await deleteNotification({ notificationId })
    } catch (error) {
      console.error("Failed to delete notification:", error)
      toast.error("Failed to delete notification")
    } finally {
      setLoadingId(null)
    }
  }

  const handleClearAll = async () => {
    setIsClearing(true)
    try {
      await clearAllNotifications({})
      setShowClearConfirm(false)
      toast.success("All notifications cleared")
    } catch (error) {
      console.error("Failed to clear all notifications:", error)
      toast.error("Failed to clear notifications")
    } finally {
      setIsClearing(false)
    }
  }

  // Show loading skeleton while data is being fetched
  if (notifications === undefined) {
    return <NotificationsLoadingSkeleton />
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔔</span>
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">
              You&apos;ll see friend requests, challenge invites, and updates
              here
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead ? "Marking..." : "Mark all read"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowClearConfirm(true)}
          >
            Clear all
          </Button>
        </div>
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your notifications. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isClearing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} disabled={isClearing}>
              {isClearing ? "Clearing..." : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-3">
        {notifications.map(notification => (
          <Card
            key={notification._id}
            className={`p-4 transition-all ${
              notification.isRead
                ? "bg-background opacity-75"
                : "bg-accent/30 border-primary/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">
                {getNotificationIcon(notification.message)}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${notification.isRead ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkAsRead(notification._id)}
                    className="h-8 px-2 text-xs"
                    disabled={loadingId !== null}
                  >
                    {loadingId === `read-${notification._id}` ? "..." : "✓"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(notification._id)}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                  disabled={loadingId !== null}
                >
                  {loadingId === `delete-${notification._id}` ? "..." : "✕"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
