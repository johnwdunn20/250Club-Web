import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentUser } from "./utils"

export const store = mutation({
  args: {},
  returns: v.id("users"),
  handler: async ctx => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Called storeUser without authentication present")
    }

    // Check if we've already stored this identity before.
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", q =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique()
    if (user !== null) {
      // If we've seen this identity before but the name has changed, patch the value.
      if (user.name !== identity.name) {
        await ctx.db.patch(user._id, { name: identity.name })
      }
      // If the email has changed, patch the value.
      if (user.email !== identity.email) {
        await ctx.db.patch(user._id, { email: identity.email })
      }
      return user._id
    }
    // If it's a new identity, create a new `User`.
    return await ctx.db.insert("users", {
      name: identity.name ?? "No name",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? undefined,
    })
  },
})

// Get current user info
export const getCurrentUserInfo = query({
  args: {},
  returns: v.object({
    _id: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
  }),
  handler: async ctx => {
    const user = await getCurrentUser(ctx)
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
    }
  },
})
