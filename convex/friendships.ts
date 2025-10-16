import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./utils";

// Search for users by email or name, excluding current user and existing friends
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    const currentUser = await getCurrentUser(ctx);

    // Get all users that match the search term
    const allUsers = await ctx.db.query("users").collect();
    
    // Filter by search term (case insensitive)
    const searchLower = searchTerm.toLowerCase();
    const matchingUsers = allUsers.filter(user => 
      user._id !== currentUser._id && (
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower)
      )
    );

    // Get existing friendships to exclude
    const existingFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const friendIds = new Set(existingFriendships.map(f => f.friendId));
    
    // Return users that aren't already friends
    return matchingUsers
      .filter(user => !friendIds.has(user._id))
      .slice(0, 10); // Limit to 10 results
  },
});

// Get all accepted friendships for current user
export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    // Get accepted friendships where current user is the userId
    const friendships = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => 
        q.eq("userId", currentUser._id).eq("status", "accepted")
      )
      .collect();

    // Get friend details
    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const friend = await ctx.db.get(friendship.friendId);
        return {
          ...friendship,
          friend,
        };
      })
    );

    return friends.filter(f => f.friend); // Filter out any deleted friends
  },
});

// Get incoming pending requests (where friendId = current user)
export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    // Get pending requests where current user is the friendId
    const requests = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => 
        q.eq("friendId", currentUser._id).eq("status", "pending")
      )
      .collect();

    // Get requester details
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const requester = await ctx.db.get(request.requesterId);
        return {
          ...request,
          requester,
        };
      })
    );

    return requestsWithUsers.filter(r => r.requester); // Filter out any deleted users
  },
});

// Get outgoing pending requests (where userId = current user)
export const getSentRequests = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    // Get pending requests where current user is the userId
    const requests = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => 
        q.eq("userId", currentUser._id).eq("status", "pending")
      )
      .collect();

    // Get friend details
    const requestsWithUsers = await Promise.all(
      requests.map(async (request) => {
        const friend = await ctx.db.get(request.friendId);
        return {
          ...request,
          friend,
        };
      })
    );

    return requestsWithUsers.filter(r => r.friend); // Filter out any deleted users
  },
});

// Send a friend request
export const sendFriendRequest = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, { friendId }) => {
    const currentUser = await getCurrentUser(ctx);

    // Can't friend yourself
    if (currentUser._id === friendId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if target user exists
    const targetUser = await ctx.db.get(friendId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    // Check if friendship already exists
    const existingFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => 
        q.eq("userId", currentUser._id).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("friendId"), friendId))
      .first();

    if (existingFriendship) {
      throw new Error("Friendship already exists");
    }

    // Create two symmetric friendship records
    await ctx.db.insert("friendships", {
      userId: currentUser._id,
      friendId: friendId,
      status: "pending",
      requesterId: currentUser._id,
    });

    await ctx.db.insert("friendships", {
      userId: friendId,
      friendId: currentUser._id,
      status: "pending",
      requesterId: currentUser._id,
    });

    return { success: true };
  },
});

// Accept a friend request
export const acceptFriendRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, { friendshipId }) => {
    const currentUser = await getCurrentUser(ctx);

    // Get the friendship record
    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    // Verify this is a pending request to the current user
    if (friendship.friendId !== currentUser._id || friendship.status !== "pending") {
      throw new Error("Invalid friendship request");
    }

    // Update both friendship records to accepted
    await ctx.db.patch(friendshipId, { status: "accepted" });

    // Find and update the symmetric record
    const symmetricFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => 
        q.eq("userId", currentUser._id).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("friendId"), friendship.userId))
      .first();

    if (symmetricFriendship) {
      await ctx.db.patch(symmetricFriendship._id, { status: "accepted" });
    }

    return { success: true };
  },
});

// Reject a friend request
export const rejectFriendRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, { friendshipId }) => {
    const currentUser = await getCurrentUser(ctx);

    // Get the friendship record
    const friendship = await ctx.db.get(friendshipId);
    if (!friendship) {
      throw new Error("Friendship not found");
    }

    // Verify this is a pending request to the current user
    if (friendship.friendId !== currentUser._id || friendship.status !== "pending") {
      throw new Error("Invalid friendship request");
    }

    // Update both friendship records to rejected
    await ctx.db.patch(friendshipId, { status: "rejected" });

    // Find and update the symmetric record
    const symmetricFriendship = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => 
        q.eq("userId", currentUser._id).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("friendId"), friendship.userId))
      .first();

    if (symmetricFriendship) {
      await ctx.db.patch(symmetricFriendship._id, { status: "rejected" });
    }

    return { success: true };
  },
});

// Remove a friend (delete friendship)
export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, { friendId }) => {
    const currentUser = await getCurrentUser(ctx);

    // Find both friendship records
    const allFriendships = await ctx.db
      .query("friendships")
      .filter((q) => 
        q.or(
          q.and(
            q.eq(q.field("userId"), currentUser._id),
            q.eq(q.field("friendId"), friendId)
          ),
          q.and(
            q.eq(q.field("userId"), friendId),
            q.eq(q.field("friendId"), currentUser._id)
          )
        )
      )
      .collect();

    const friendship1 = allFriendships.find(f => f.userId === currentUser._id && f.friendId === friendId);
    const friendship2 = allFriendships.find(f => f.userId === friendId && f.friendId === currentUser._id);

    // Delete both records if they exist
    if (friendship1) {
      await ctx.db.delete(friendship1._id);
    }
    if (friendship2) {
      await ctx.db.delete(friendship2._id);
    }

    return { success: true };
  },
});
