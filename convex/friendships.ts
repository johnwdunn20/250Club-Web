import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentUser } from "./utils"

// Search for users by email or name, excluding current user and existing friends
export const searchUsers = query({
  args: { searchTerm: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("users"),
      _creationTime: v.number(),
      name: v.string(),
      tokenIdentifier: v.string(),
      email: v.optional(v.string()),
    })
  ),
  handler: async (ctx, { searchTerm }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get all users that match the search term
    const allUsers = await ctx.db.query("users").collect()

    // Filter by search term (case insensitive)
    const searchLower = searchTerm.toLowerCase()
    const matchingUsers = allUsers.filter(
      user =>
        user._id !== currentUser._id &&
        (user.name?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower))
    )

    // Get existing friendships to exclude
    const existingFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    // Get existing friend requests to exclude
    const existingRequests = await ctx.db
      .query("friend_requests")
      .withIndex("by_requester", q => q.eq("requesterId", currentUser._id))
      .collect()

    const sentRequestIds = new Set(existingRequests.map(r => r.recipientId))

    const existingRequestsToMe = await ctx.db
      .query("friend_requests")
      .withIndex("by_recipient", q => q.eq("recipientId", currentUser._id))
      .collect()

    const receivedRequestIds = new Set(
      existingRequestsToMe.map(r => r.requesterId)
    )

    const friendIds = new Set(existingFriendships.map(f => f.friendId))

    // Return users that aren't already friends or have pending requests
    return matchingUsers
      .filter(
        user =>
          !friendIds.has(user._id) &&
          !sentRequestIds.has(user._id) &&
          !receivedRequestIds.has(user._id)
      )
      .slice(0, 10) // Limit to 10 results
  },
})

// Get all accepted friendships for current user
export const getFriends = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("friendships"),
      _creationTime: v.number(),
      userId: v.id("users"),
      friendId: v.id("users"),
      friend: v.union(
        v.object({
          _id: v.id("users"),
          _creationTime: v.number(),
          name: v.string(),
          tokenIdentifier: v.string(),
          email: v.optional(v.string()),
        }),
        v.null()
      ),
    })
  ),
  handler: async ctx => {
    const currentUser = await getCurrentUser(ctx)

    // Get friendships where current user is the userId
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    // Batch fetch all friend user records at once
    const friendIds = friendships.map(f => f.friendId)
    const friendUsers = await Promise.all(friendIds.map(id => ctx.db.get(id)))

    // Map friends to friendships
    const friendsMap = new Map(
      friendUsers.filter(f => f !== null).map(f => [f!._id, f])
    )

    return friendships
      .map(friendship => ({
        ...friendship,
        friend: friendsMap.get(friendship.friendId) || null,
      }))
      .filter(f => f.friend !== null)
  },
})

// Get incoming pending requests (where recipientId = current user)
export const getPendingRequests = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("friend_requests"),
      _creationTime: v.number(),
      requesterId: v.id("users"),
      recipientId: v.id("users"),
      createdAt: v.number(),
      requester: v.union(
        v.object({
          _id: v.id("users"),
          _creationTime: v.number(),
          name: v.string(),
          tokenIdentifier: v.string(),
          email: v.optional(v.string()),
        }),
        v.null()
      ),
    })
  ),
  handler: async ctx => {
    const currentUser = await getCurrentUser(ctx)

    // Get pending requests where current user is the recipientId
    const requests = await ctx.db
      .query("friend_requests")
      .withIndex("by_recipient", q => q.eq("recipientId", currentUser._id))
      .collect()

    // Batch fetch all requester user records at once
    const requesterIds = requests.map(r => r.requesterId)
    const requesterUsers = await Promise.all(
      requesterIds.map(id => ctx.db.get(id))
    )

    // Map requesters to requests
    const requestersMap = new Map(
      requesterUsers.filter(r => r !== null).map(r => [r!._id, r])
    )

    return requests
      .map(request => ({
        ...request,
        requester: requestersMap.get(request.requesterId) || null,
      }))
      .filter(r => r.requester !== null)
  },
})

// Get outgoing pending requests (where requesterId = current user)
export const getSentRequests = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("friend_requests"),
      _creationTime: v.number(),
      requesterId: v.id("users"),
      recipientId: v.id("users"),
      createdAt: v.number(),
      friend: v.union(
        v.object({
          _id: v.id("users"),
          _creationTime: v.number(),
          name: v.string(),
          tokenIdentifier: v.string(),
          email: v.optional(v.string()),
        }),
        v.null()
      ),
    })
  ),
  handler: async ctx => {
    const currentUser = await getCurrentUser(ctx)

    // Get pending requests where current user is the requesterId
    const requests = await ctx.db
      .query("friend_requests")
      .withIndex("by_requester", q => q.eq("requesterId", currentUser._id))
      .collect()

    // Batch fetch all recipient user records at once
    const recipientIds = requests.map(r => r.recipientId)
    const recipientUsers = await Promise.all(
      recipientIds.map(id => ctx.db.get(id))
    )

    // Map recipients to requests
    const recipientsMap = new Map(
      recipientUsers.filter(r => r !== null).map(r => [r!._id, r])
    )

    return requests
      .map(request => ({
        ...request,
        friend: recipientsMap.get(request.recipientId) || null, // Keep same interface for compatibility
      }))
      .filter(r => r.friend !== null)
  },
})

// Send a friend request
export const sendFriendRequest = mutation({
  args: { friendId: v.id("users") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { friendId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Can't friend yourself
    if (currentUser._id === friendId) {
      throw new Error("Cannot send friend request to yourself")
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(friendId)
    if (!targetUser) {
      throw new Error("User not found")
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .filter(q => q.eq(q.field("friendId"), friendId))
      .first()

    if (existingFriendship) {
      throw new Error("Friendship already exists")
    }

    // Check if request already exists (both directions)
    const existingRequest = await ctx.db
      .query("friend_requests")
      .withIndex("by_requester", q => q.eq("requesterId", currentUser._id))
      .filter(q => q.eq(q.field("recipientId"), friendId))
      .first()

    if (existingRequest) {
      throw new Error("Friend request already sent")
    }

    const existingRequestToMe = await ctx.db
      .query("friend_requests")
      .withIndex("by_recipient", q => q.eq("recipientId", currentUser._id))
      .filter(q => q.eq(q.field("requesterId"), friendId))
      .first()

    if (existingRequestToMe) {
      throw new Error("This user has already sent you a friend request")
    }

    // Create friend request
    await ctx.db.insert("friend_requests", {
      requesterId: currentUser._id,
      recipientId: friendId,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

// Accept a friend request
export const acceptFriendRequest = mutation({
  args: { friendshipId: v.id("friend_requests") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { friendshipId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the friend request record
    const request = await ctx.db.get(friendshipId)
    if (!request) {
      throw new Error("Friend request not found")
    }

    // Verify this is a request to the current user
    if (request.recipientId !== currentUser._id) {
      throw new Error("Invalid friend request")
    }

    // Delete the request
    await ctx.db.delete(friendshipId)

    // Create two symmetric friendship records
    await ctx.db.insert("friendships", {
      userId: request.requesterId,
      friendId: currentUser._id,
    })

    await ctx.db.insert("friendships", {
      userId: currentUser._id,
      friendId: request.requesterId,
    })

    return { success: true }
  },
})

// Reject a friend request
export const rejectFriendRequest = mutation({
  args: { friendshipId: v.id("friend_requests") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { friendshipId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the friend request record
    const request = await ctx.db.get(friendshipId)
    if (!request) {
      throw new Error("Friend request not found")
    }

    // Verify this is a request to the current user
    if (request.recipientId !== currentUser._id) {
      throw new Error("Invalid friend request")
    }

    // Delete the request
    await ctx.db.delete(friendshipId)

    return { success: true }
  },
})

// Remove a friend (delete friendship)
export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { friendId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Find and delete both symmetric friendship records
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .filter(q => q.eq(q.field("friendId"), friendId))
      .first()

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_user", q => q.eq("userId", friendId))
      .filter(q => q.eq(q.field("friendId"), currentUser._id))
      .first()

    // Delete both records if they exist
    if (friendship1) {
      await ctx.db.delete(friendship1._id)
    }
    if (friendship2) {
      await ctx.db.delete(friendship2._id)
    }

    return { success: true }
  },
})

// Cancel a sent friend request
export const cancelFriendRequest = mutation({
  args: { requestId: v.id("friend_requests") },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, { requestId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the friend request record
    const request = await ctx.db.get(requestId)
    if (!request) {
      throw new Error("Friend request not found")
    }

    // Verify this is a request from the current user
    if (request.requesterId !== currentUser._id) {
      throw new Error("You can only cancel your own friend requests")
    }

    // Delete the request
    await ctx.db.delete(requestId)

    return { success: true }
  },
})
