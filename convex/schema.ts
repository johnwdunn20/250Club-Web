import { defineTable, defineSchema } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    tokenIdentifier: v.string(),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  friendships: defineTable({
    userId: v.id("users"),
    friendId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected")
    ),
    requesterId: v.id("users"),
  })
    .index("by_user", ["userId", "status"])
    .index("by_friend", ["friendId", "status"]),

  challenges: defineTable({
    name: v.string(),
    creatorId: v.id("users"),
    date: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  })
    .index("by_creator_and_date", ["creatorId", "date"])
    .index("by_date", ["date"]),

  challenge_participants: defineTable({
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    status: v.union(
      v.literal("invited"),
      v.literal("active"),
      v.literal("completed")
    ),
  })
    .index("by_challenge", ["challengeId"])
    .index("by_user", ["userId"]),

  exercises: defineTable({
    challengeId: v.id("challenges"),
    name: v.string(),
    targetReps: v.number(),
    order: v.number(),
  }).index("by_challenge", ["challengeId"]),

  exercise_progress: defineTable({
    exerciseId: v.id("exercises"),
    userId: v.id("users"),
    challengeId: v.id("challenges"),
    completedReps: v.number(),
  })
    .index("by_exercise_and_user", ["exerciseId", "userId"])
    .index("by_challenge_and_user", ["challengeId", "userId"])
    .index("by_exercise", ["exerciseId"]),
});
