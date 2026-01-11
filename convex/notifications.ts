import { query, mutation, internalMutation } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { getCurrentUser } from "./utils"
import { Id } from "./_generated/dataModel"

export const getNotifications = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      message: v.string(),
      isRead: v.boolean(),
      createdAt: v.number(),
      type: v.union(
        v.literal("friend_request"),
        v.literal("challenge_invitation"),
        v.literal("info")
      ),
      relatedId: v.optional(v.string()),
    })
  ),
  handler: async ctx => {
    const user = await getCurrentUser(ctx)

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .order("desc")
      .collect()

    return notifications.map(notification => ({
      _id: notification._id,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
      type: notification.type ?? "info",
      relatedId: notification.relatedId,
    }))
  },
})

export const getUnreadCount = query({
  args: {},
  returns: v.number(),
  handler: async ctx => {
    const user = await getCurrentUser(ctx)

    const unreadNotifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", q =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect()

    return unreadNotifications.length
  },
})

export const markAsRead = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }

    if (notification.userId !== user._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.patch(args.notificationId, {
      isRead: true,
    })

    return null
  },
})

export const markAllAsRead = mutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const user = await getCurrentUser(ctx)

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", q =>
        q.eq("userId", user._id).eq("isRead", false)
      )
      .collect()

    await Promise.all(
      notifications.map(notification =>
        ctx.db.patch(notification._id, { isRead: true })
      )
    )

    return null
  },
})

// Internal mutation to create a notification (called from other mutations)
export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    type: v.union(
      v.literal("friend_request"),
      v.literal("challenge_invitation"),
      v.literal("info")
    ),
    relatedId: v.optional(v.string()),
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
      type: args.type,
      relatedId: args.relatedId,
    })
  },
})

// Delete a single notification
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx)

    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }

    if (notification.userId !== user._id) {
      throw new Error("Unauthorized")
    }

    await ctx.db.delete(args.notificationId)

    return null
  },
})

// Clear all notifications for the current user
export const clearAllNotifications = mutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const user = await getCurrentUser(ctx)

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect()

    await Promise.all(
      notifications.map(notification => ctx.db.delete(notification._id))
    )

    return null
  },
})

// Accept a friend request from a notification
export const acceptFriendRequestFromNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)

    // Get and verify the notification
    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }
    if (notification.userId !== currentUser._id) {
      throw new Error("Unauthorized")
    }
    if (notification.type !== "friend_request" || !notification.relatedId) {
      throw new Error("Invalid notification type")
    }

    // Get the friend request
    const friendRequestId = notification.relatedId as Id<"friend_requests">
    const request = await ctx.db.get(friendRequestId)

    // Delete the notification first
    await ctx.db.delete(args.notificationId)

    // If request doesn't exist anymore, it was already handled
    if (!request) {
      return null
    }

    // Verify this is a request to the current user
    if (request.recipientId !== currentUser._id) {
      throw new Error("Invalid friend request")
    }

    // Delete the request
    await ctx.db.delete(friendRequestId)

    // Create two symmetric friendship records
    await ctx.db.insert("friendships", {
      userId: request.requesterId,
      friendId: currentUser._id,
    })

    await ctx.db.insert("friendships", {
      userId: currentUser._id,
      friendId: request.requesterId,
    })

    // Notify requester that their request was accepted
    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      userId: request.requesterId,
      message: `${currentUser.name} accepted your friend request`,
      type: "info" as const,
    })

    return null
  },
})

// Decline a friend request from a notification
export const declineFriendRequestFromNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)

    // Get and verify the notification
    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }
    if (notification.userId !== currentUser._id) {
      throw new Error("Unauthorized")
    }
    if (notification.type !== "friend_request" || !notification.relatedId) {
      throw new Error("Invalid notification type")
    }

    // Get the friend request
    const friendRequestId = notification.relatedId as Id<"friend_requests">
    const request = await ctx.db.get(friendRequestId)

    // Delete the notification first
    await ctx.db.delete(args.notificationId)

    // If request doesn't exist anymore, it was already handled
    if (!request) {
      return null
    }

    // Verify this is a request to the current user
    if (request.recipientId !== currentUser._id) {
      throw new Error("Invalid friend request")
    }

    // Delete the request
    await ctx.db.delete(friendRequestId)

    return null
  },
})

// Accept a challenge invitation from a notification
export const acceptChallengeFromNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)

    // Get and verify the notification
    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }
    if (notification.userId !== currentUser._id) {
      throw new Error("Unauthorized")
    }
    if (
      notification.type !== "challenge_invitation" ||
      !notification.relatedId
    ) {
      throw new Error("Invalid notification type")
    }

    // Get the participation record
    const participantId = notification.relatedId as Id<"challenge_participants">
    const participation = await ctx.db.get(participantId)

    // Delete the notification first
    await ctx.db.delete(args.notificationId)

    // If participation doesn't exist anymore, it was already handled
    if (!participation) {
      return null
    }

    // Verify the invitation belongs to the current user
    if (participation.userId !== currentUser._id) {
      throw new Error("You are not authorized to accept this invitation")
    }

    // Verify the participation is still in "invited" status
    if (participation.status !== "invited") {
      return null // Already processed
    }

    // Update status to active
    await ctx.db.patch(participantId, {
      status: "active",
    })

    // Send notification to challenge creator
    const challenge = await ctx.db.get(participation.challengeId)
    if (challenge) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          userId: challenge.creatorId,
          message: `${currentUser.name} accepted your invitation to "${challenge.name}"`,
          type: "info" as const,
        }
      )
    }

    return null
  },
})

// Decline a challenge invitation from a notification
export const declineChallengeFromNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const currentUser = await getCurrentUser(ctx)

    // Get and verify the notification
    const notification = await ctx.db.get(args.notificationId)
    if (!notification) {
      throw new Error("Notification not found")
    }
    if (notification.userId !== currentUser._id) {
      throw new Error("Unauthorized")
    }
    if (
      notification.type !== "challenge_invitation" ||
      !notification.relatedId
    ) {
      throw new Error("Invalid notification type")
    }

    // Get the participation record
    const participantId = notification.relatedId as Id<"challenge_participants">
    const participation = await ctx.db.get(participantId)

    // Delete the notification first
    await ctx.db.delete(args.notificationId)

    // If participation doesn't exist anymore, it was already handled
    if (!participation) {
      return null
    }

    // Verify the invitation belongs to the current user
    if (participation.userId !== currentUser._id) {
      throw new Error("You are not authorized to decline this invitation")
    }

    // Verify the participation is still in "invited" status
    if (participation.status !== "invited") {
      return null // Already processed
    }

    // Delete the participation record
    await ctx.db.delete(participantId)

    // Send notification to challenge creator
    const challenge = await ctx.db.get(participation.challengeId)
    if (challenge) {
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          userId: challenge.creatorId,
          message: `${currentUser.name} declined your invitation to "${challenge.name}"`,
          type: "info" as const,
        }
      )
    }

    return null
  },
})
