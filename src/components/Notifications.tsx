"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { NotificationsLoadingSkeleton } from "@/components/skeletons/NotificationCardSkeleton";

export default function Notifications() {
  const notifications = useQuery(api.notifications.getNotifications);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    await markAsRead({ notificationId });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({});
  };

  if (notifications === undefined) {
    return <NotificationsLoadingSkeleton />;
  }

  if (notifications.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🔔</span>
            <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
            <p className="text-muted-foreground">
              You&apos;ll see friend requests, challenge invites, and updates here
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification._id}
            className={`p-4 ${
              notification.isRead ? "bg-background" : "bg-accent/50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm">{notification.message}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkAsRead(notification._id)}
                  className="shrink-0"
                >
                  Mark as read
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
