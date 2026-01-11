import { query, mutation, internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentUser } from "./utils"

export const getNotifications = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("notifications"),
      message: v.string(),
      isRead: v.boolean(),
      createdAt: v.number(),
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
  },
  returns: v.id("notifications"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      message: args.message,
      isRead: false,
      createdAt: Date.now(),
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
