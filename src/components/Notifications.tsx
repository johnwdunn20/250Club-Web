"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import type { Notifications, Notification } from "@/types/convex"
import { NotificationsLoadingSkeleton } from "./skeletons/NotificationCardSkeleton"
import { formatTimestampRelative } from "@/lib/utils"
import { toast } from "sonner"

interface NotificationsProps {
  notifications: Notifications | undefined
}

// Helper to get notification icon based on type and content
function getNotificationIcon(notification: Notification): string {
  switch (notification.type) {
    case "friend_request":
      return "👥"
    case "challenge_invitation":
      return "🎯"
    default:
      // Fallback to content-based detection for info type
      if (
        notification.message.includes("accepted") ||
        notification.message.includes("friend")
      ) {
        return "👥"
      } else if (notification.message.includes("challenge")) {
        return "🎯"
      } else if (
        notification.message.includes("completed") ||
        notification.message.includes("streak")
      ) {
        return "🏆"
      } else if (
        notification.message.includes("declined") ||
        notification.message.includes("left") ||
        notification.message.includes("cancelled")
      ) {
        return "👋"
      }
      return "🔔"
  }
}

export default function Notifications({ notifications }: NotificationsProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [declineConfirm, setDeclineConfirm] = useState<{
    isOpen: boolean
    notificationId: Id<"notifications"> | null
    type: "friend_request" | "challenge_invitation" | null
  } | null>(null)

  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)
  const deleteNotification = useMutation(api.notifications.deleteNotification)
  const clearAllNotifications = useMutation(
    api.notifications.clearAllNotifications
  )

  // Action mutations for actionable notifications
  const acceptFriendRequest = useMutation(
    api.notifications.acceptFriendRequestFromNotification
  )
  const declineFriendRequest = useMutation(
    api.notifications.declineFriendRequestFromNotification
  )
  const acceptChallenge = useMutation(
    api.notifications.acceptChallengeFromNotification
  )
  const declineChallenge = useMutation(
    api.notifications.declineChallengeFromNotification
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

  const handleAcceptFriendRequest = async (
    notificationId: Id<"notifications">
  ) => {
    setLoadingId(`accept-friend-${notificationId}`)
    try {
      await acceptFriendRequest({ notificationId })
      toast.success("Friend request accepted!")
    } catch (error) {
      console.error("Failed to accept friend request:", error)
      toast.error("Failed to accept friend request")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeclineFriendRequest = async (
    notificationId: Id<"notifications">
  ) => {
    setLoadingId(`decline-friend-${notificationId}`)
    try {
      await declineFriendRequest({ notificationId })
      toast.info("Friend request declined")
    } catch (error) {
      console.error("Failed to decline friend request:", error)
      toast.error("Failed to decline friend request")
    } finally {
      setLoadingId(null)
    }
  }

  const handleAcceptChallenge = async (notificationId: Id<"notifications">) => {
    setLoadingId(`accept-challenge-${notificationId}`)
    try {
      await acceptChallenge({ notificationId })
      toast.success("Challenge invitation accepted!")
    } catch (error) {
      console.error("Failed to accept challenge:", error)
      toast.error("Failed to accept challenge invitation")
    } finally {
      setLoadingId(null)
    }
  }

  const handleDeclineChallenge = async (
    notificationId: Id<"notifications">
  ) => {
    setLoadingId(`decline-challenge-${notificationId}`)
    try {
      await declineChallenge({ notificationId })
      toast.info("Challenge invitation declined")
    } catch (error) {
      console.error("Failed to decline challenge:", error)
      toast.error("Failed to decline challenge invitation")
    } finally {
      setLoadingId(null)
    }
  }

  const handleConfirmDecline = async () => {
    if (!declineConfirm?.notificationId || !declineConfirm?.type) return

    if (declineConfirm.type === "friend_request") {
      await handleDeclineFriendRequest(declineConfirm.notificationId)
    } else {
      await handleDeclineChallenge(declineConfirm.notificationId)
    }
    setDeclineConfirm(null)
  }

  // Show loading skeleton while data is being fetched
  if (notifications === undefined) {
    return <NotificationsLoadingSkeleton />
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="card-mobile">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔔</span>
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">
              You&apos;ll see friend requests, challenge invites, and updates
              here
            </p>
          </div>
        </div>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <Badge>{unreadCount} new</Badge>}
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

      {/* Decline Confirmation Dialog */}
      <AlertDialog
        open={declineConfirm?.isOpen}
        onOpenChange={open => !open && setDeclineConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {declineConfirm?.type === "friend_request"
                ? "Decline friend request?"
                : "Decline challenge invitation?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {declineConfirm?.type === "friend_request"
                ? "Are you sure you want to decline this friend request?"
                : "Are you sure you want to decline this challenge invitation?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDecline}
              disabled={loadingId !== null}
            >
              {loadingId !== null ? "Declining..." : "Decline"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-3">
        {notifications.map(notification => (
          <div
            key={notification._id}
            className={`card-mobile transition-all ${
              notification.isRead
                ? "bg-background opacity-75"
                : "bg-accent/30 border-primary/20"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">
                {getNotificationIcon(notification)}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${notification.isRead ? "text-muted-foreground" : "text-foreground"}`}
                >
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestampRelative(notification.createdAt)}
                </p>

                {/* Action buttons for actionable notifications */}
                {notification.type === "friend_request" && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleAcceptFriendRequest(notification._id)
                      }
                      disabled={loadingId !== null}
                    >
                      {loadingId === `accept-friend-${notification._id}`
                        ? "Accepting..."
                        : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDeclineConfirm({
                          isOpen: true,
                          notificationId: notification._id,
                          type: "friend_request",
                        })
                      }
                      disabled={loadingId !== null}
                    >
                      {loadingId === `decline-friend-${notification._id}`
                        ? "Declining..."
                        : "Decline"}
                    </Button>
                  </div>
                )}

                {notification.type === "challenge_invitation" && (
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptChallenge(notification._id)}
                      disabled={loadingId !== null}
                    >
                      {loadingId === `accept-challenge-${notification._id}`
                        ? "Accepting..."
                        : "Accept"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setDeclineConfirm({
                          isOpen: true,
                          notificationId: notification._id,
                          type: "challenge_invitation",
                        })
                      }
                      disabled={loadingId !== null}
                    >
                      {loadingId === `decline-challenge-${notification._id}`
                        ? "Declining..."
                        : "Decline"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Only show dismiss for info notifications */}
              {notification.type === "info" && (
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
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
