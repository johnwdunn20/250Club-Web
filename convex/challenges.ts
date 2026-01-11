import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { getCurrentUser, getTodayDateFromTimezone } from "./utils"
import { internal } from "./_generated/api"

// Create a new challenge with exercises and participants
export const createChallenge = mutation({
  args: {
    name: v.string(),
    date: v.string(),
    exercises: v.array(
      v.object({
        name: v.string(),
        targetReps: v.number(),
      })
    ),
    friendIds: v.array(v.id("users")),
  },
  returns: v.object({
    challengeId: v.id("challenges"),
    exerciseIds: v.array(v.id("exercises")),
  }),
  handler: async (ctx, { name, date, exercises, friendIds }) => {
    const currentUser = await getCurrentUser(ctx)

    // Validate exercises array
    if (exercises.length === 0) {
      throw new Error("At least one exercise is required")
    }

    // Validate exercise data
    for (const exercise of exercises) {
      if (!exercise.name.trim()) {
        throw new Error("Exercise name cannot be empty")
      }
      if (exercise.targetReps <= 0) {
        throw new Error("Target reps must be greater than 0")
      }
    }

    // Create the challenge
    const challengeId = await ctx.db.insert("challenges", {
      name: name.trim(),
      creatorId: currentUser._id,
      date,
      status: "active",
    })

    // Create exercises
    const exerciseIds = []
    for (let i = 0; i < exercises.length; i++) {
      const exerciseId = await ctx.db.insert("exercises", {
        challengeId,
        name: exercises[i].name.trim(),
        targetReps: exercises[i].targetReps,
        order: i,
      })
      exerciseIds.push(exerciseId)
    }

    // Create challenge participants
    // Creator is automatically active
    await ctx.db.insert("challenge_participants", {
      challengeId,
      userId: currentUser._id,
      status: "active",
    })

    // Invited friends get invited status
    for (const friendId of friendIds) {
      // Verify friend exists and is actually a friend
      const friend = await ctx.db.get(friendId)
      if (!friend) {
        throw new Error("One or more selected friends not found")
      }

      // Check if friendship exists
      const friendship = await ctx.db
        .query("friendships")
        .withIndex("by_user", q => q.eq("userId", currentUser._id))
        .filter(q => q.eq(q.field("friendId"), friendId))
        .first()

      if (!friendship) {
        throw new Error("One or more selected users are not your friends")
      }

      const participantId = await ctx.db.insert("challenge_participants", {
        challengeId,
        userId: friendId,
        status: "invited",
      })

      // Send notification to invited user
      await ctx.scheduler.runAfter(
        0,
        internal.notifications.createNotification,
        {
          userId: friendId,
          message: `${
            currentUser.name
          } invited you to the challenge "${name.trim()}" on ${date}`,
          type: "challenge_invitation" as const,
          relatedId: participantId,
        }
      )
    }

    return { challengeId, exerciseIds }
  },
})

// Get user's challenges (active and completed)
export const getUserChallenges = query({
  args: {},
  handler: async ctx => {
    const currentUser = await getCurrentUser(ctx)

    // Get challenges where user is a participant
    const userParticipations = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    const challengeIds = userParticipations.map(p => p.challengeId)

    // Batch fetch all challenges at once
    const challengesData = await Promise.all(
      challengeIds.map(id => ctx.db.get(id))
    )

    // Get unique creator IDs
    const creatorIds = [
      ...new Set(challengesData.filter(c => c !== null).map(c => c!.creatorId)),
    ]

    // Batch fetch all creators
    const creatorsData = await Promise.all(creatorIds.map(id => ctx.db.get(id)))
    const creatorsMap = new Map(
      creatorsData.filter(c => c !== null).map(c => [c!._id, c])
    )

    // Build challenges with details
    const challenges = await Promise.all(
      challengesData.map(async (challenge, index) => {
        if (!challenge) return null

        const challengeId = challengeIds[index]

        // Get exercises and participant count in parallel
        const [exercises, allParticipants] = await Promise.all([
          ctx.db
            .query("exercises")
            .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
            .collect(),
          ctx.db
            .query("challenge_participants")
            .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
            .collect(),
        ])

        return {
          ...challenge,
          exercises,
          participantCount: allParticipants.length,
          creator: creatorsMap.get(challenge.creatorId) || null,
          userStatus: userParticipations.find(
            p => p.challengeId === challengeId
          )?.status,
        }
      })
    )

    // Filter out null challenges and sort by date (newest first)
    return challenges
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  },
})

// Get challenge details by ID
export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const currentUser = await getCurrentUser(ctx)

    const challenge = await ctx.db.get(challengeId)
    if (!challenge) {
      throw new Error("Challenge not found")
    }

    // Check if user is a participant
    const participation = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
      .filter(q => q.eq(q.field("userId"), currentUser._id))
      .first()

    if (!participation) {
      throw new Error("You are not a participant in this challenge")
    }

    // Get exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
      .collect()

    // Get all participants
    const participants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
      .collect()

    // Get participant details
    const participantsWithUsers = await Promise.all(
      participants.map(async participant => {
        const user = await ctx.db.get(participant.userId)
        return {
          ...participant,
          user,
        }
      })
    )

    // Get creator info
    const creator = await ctx.db.get(challenge.creatorId)

    return {
      ...challenge,
      exercises: exercises.sort((a, b) => a.order - b.order),
      participants: participantsWithUsers,
      creator,
      userStatus: participation.status,
    }
  },
})

// Get today's challenges for the current user
export const getTodaysChallenge = query({
  args: { timezone: v.optional(v.string()) },
  handler: async (ctx, { timezone }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get today's date in YYYY-MM-DD format (user's timezone if provided, otherwise UTC fallback)
    const today = timezone
      ? getTodayDateFromTimezone(timezone)
      : new Date().toISOString().split("T")[0]

    // Find challenges for today where user is a participant
    const participants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    const challengeIds = participants.map(p => p.challengeId)

    // Find all of today's challenges
    const todaysChallenges = []
    for (const challengeId of challengeIds) {
      const challenge = await ctx.db.get(challengeId)
      if (
        challenge &&
        challenge.date === today &&
        challenge.status === "active"
      ) {
        todaysChallenges.push(challenge)
      }
    }

    if (todaysChallenges.length === 0) {
      return null
    }

    // Get details for each challenge
    const challengesWithDetails = await Promise.all(
      todaysChallenges.map(async todaysChallenge => {
        // Get exercises for this challenge
        const exercises = await ctx.db
          .query("exercises")
          .withIndex("by_challenge", q =>
            q.eq("challengeId", todaysChallenge._id)
          )
          .collect()

        // Get all participants
        const allParticipants = await ctx.db
          .query("challenge_participants")
          .withIndex("by_challenge", q =>
            q.eq("challengeId", todaysChallenge._id)
          )
          .collect()

        // Get participant details with their progress
        const participantsWithProgress = await Promise.all(
          allParticipants.map(async participant => {
            const user = await ctx.db.get(participant.userId)

            // Get user's progress for each exercise
            const exerciseProgress = await Promise.all(
              exercises.map(async exercise => {
                const progress = await ctx.db
                  .query("exercise_progress")
                  .withIndex("by_exercise_and_user", q =>
                    q
                      .eq("exerciseId", exercise._id)
                      .eq("userId", participant.userId)
                  )
                  .first()

                return {
                  exerciseId: exercise._id,
                  exerciseName: exercise.name,
                  targetReps: exercise.targetReps,
                  completedReps: progress?.completedReps || 0,
                }
              })
            )

            // Calculate totals
            const totalCompleted = exerciseProgress.reduce(
              (sum, ep) => sum + ep.completedReps,
              0
            )
            const totalTarget = exerciseProgress.reduce(
              (sum, ep) => sum + ep.targetReps,
              0
            )
            const completionPercentage =
              totalTarget > 0
                ? Math.round((totalCompleted / totalTarget) * 100)
                : 0

            return {
              ...participant,
              user,
              exerciseProgress,
              totalCompleted,
              totalTarget,
              completionPercentage,
            }
          })
        )

        // Get creator info
        const creator = await ctx.db.get(todaysChallenge.creatorId)

        return {
          ...todaysChallenge,
          exercises: exercises.sort((a, b) => a.order - b.order),
          participants: participantsWithProgress,
          creator,
          currentUserId: currentUser._id,
        }
      })
    )

    return challengesWithDetails
  },
})

// Update exercise progress for the current user
export const updateExerciseProgress = mutation({
  args: {
    exerciseId: v.id("exercises"),
    completedReps: v.number(),
  },
  returns: v.id("exercise_progress"),
  handler: async (ctx, { exerciseId, completedReps }) => {
    const currentUser = await getCurrentUser(ctx)

    // Validate completed reps
    if (completedReps < 0) {
      throw new Error("Completed reps cannot be negative")
    }

    // Get the exercise to find the challenge
    const exercise = await ctx.db.get(exerciseId)
    if (!exercise) {
      throw new Error("Exercise not found")
    }

    // Check if user is a participant in this challenge
    const participation = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", q => q.eq("challengeId", exercise.challengeId))
      .filter(q => q.eq(q.field("userId"), currentUser._id))
      .first()

    if (!participation) {
      throw new Error("You are not a participant in this challenge")
    }

    // Check if progress already exists
    const existingProgress = await ctx.db
      .query("exercise_progress")
      .withIndex("by_exercise_and_user", q =>
        q.eq("exerciseId", exerciseId).eq("userId", currentUser._id)
      )
      .first()

    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        completedReps,
      })
      return existingProgress._id
    } else {
      // Create new progress
      return await ctx.db.insert("exercise_progress", {
        exerciseId,
        userId: currentUser._id,
        challengeId: exercise.challengeId,
        completedReps,
      })
    }
  },
})

// Get user's current streak (consecutive days with 100% challenge completion)
export const getUserStreak = query({
  args: { timezone: v.optional(v.string()) },
  returns: v.object({
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastCompletedDate: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, { timezone }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get all challenges where user is a participant
    const participations = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    const challengeIds = participations.map(p => p.challengeId)

    // Get challenge details and calculate completion status for each
    const completedDates: Set<string> = new Set()

    for (const challengeId of challengeIds) {
      const challenge = await ctx.db.get(challengeId)
      if (!challenge || challenge.status !== "active") continue

      // Get exercises for this challenge
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
        .collect()

      if (exercises.length === 0) continue

      // Get user's progress for all exercises in this challenge
      let totalTarget = 0
      let totalCompleted = 0

      for (const exercise of exercises) {
        totalTarget += exercise.targetReps

        const progress = await ctx.db
          .query("exercise_progress")
          .withIndex("by_exercise_and_user", q =>
            q.eq("exerciseId", exercise._id).eq("userId", currentUser._id)
          )
          .first()

        if (progress) {
          totalCompleted += Math.min(
            progress.completedReps,
            exercise.targetReps
          )
        }
      }

      // Mark date as completed if user achieved 100%
      if (totalCompleted >= totalTarget) {
        completedDates.add(challenge.date)
      }
    }

    // Sort dates in descending order
    const sortedDates = Array.from(completedDates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )

    // Calculate current streak
    let currentStreak = 0
    const today = timezone
      ? getTodayDateFromTimezone(timezone)
      : new Date().toISOString().split("T")[0]

    // Start from today and count backwards
    const todayDate = new Date(today)

    for (let i = 0; i <= sortedDates.length; i++) {
      const checkDate = new Date(todayDate)
      checkDate.setDate(checkDate.getDate() - i)
      const checkDateStr = checkDate.toISOString().split("T")[0]

      if (completedDates.has(checkDateStr)) {
        currentStreak++
      } else if (i > 0) {
        // Allow today to be incomplete, but break if past day is missing
        break
      }
    }

    // Calculate longest streak
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null

    for (const dateStr of sortedDates) {
      const currentDate = new Date(dateStr)

      if (lastDate === null) {
        tempStreak = 1
      } else {
        const dayDiff = Math.round(
          (lastDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (dayDiff === 1) {
          tempStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
        }
      }

      lastDate = currentDate
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    return {
      currentStreak,
      longestStreak,
      lastCompletedDate: sortedDates[0] || null,
    }
  },
})

// Get pending challenge invitations for the current user
export const getPendingInvitations = query({
  args: {},
  returns: v.array(
    v.object({
      participantId: v.id("challenge_participants"),
      challengeId: v.id("challenges"),
      challengeName: v.string(),
      date: v.string(),
      creatorName: v.string(),
      exerciseCount: v.number(),
      participantCount: v.number(),
    })
  ),
  handler: async ctx => {
    const currentUser = await getCurrentUser(ctx)

    // Get all invited participations for the current user
    const invitations = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    const pendingInvitations = invitations.filter(p => p.status === "invited")

    // Get challenge details for each invitation
    const invitationsWithDetails = await Promise.all(
      pendingInvitations.map(async invitation => {
        const challenge = await ctx.db.get(invitation.challengeId)
        if (!challenge) return null

        const creator = await ctx.db.get(challenge.creatorId)

        const exercises = await ctx.db
          .query("exercises")
          .withIndex("by_challenge", q =>
            q.eq("challengeId", invitation.challengeId)
          )
          .collect()

        const participants = await ctx.db
          .query("challenge_participants")
          .withIndex("by_challenge", q =>
            q.eq("challengeId", invitation.challengeId)
          )
          .collect()

        return {
          participantId: invitation._id,
          challengeId: challenge._id,
          challengeName: challenge.name,
          date: challenge.date,
          creatorName: creator?.name || "Unknown",
          exerciseCount: exercises.length,
          participantCount: participants.length,
        }
      })
    )

    return invitationsWithDetails.filter(
      (inv): inv is NonNullable<typeof inv> => inv !== null
    )
  },
})

// Accept a challenge invitation
export const acceptChallengeInvitation = mutation({
  args: {
    participantId: v.id("challenge_participants"),
  },
  returns: v.null(),
  handler: async (ctx, { participantId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the participation record
    const participation = await ctx.db.get(participantId)
    if (!participation) {
      throw new Error("Invitation not found")
    }

    // Verify the invitation belongs to the current user
    if (participation.userId !== currentUser._id) {
      throw new Error("You are not authorized to accept this invitation")
    }

    // Verify the participation is still in "invited" status
    if (participation.status !== "invited") {
      throw new Error("This invitation has already been processed")
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

// Decline a challenge invitation
export const declineChallengeInvitation = mutation({
  args: {
    participantId: v.id("challenge_participants"),
  },
  returns: v.null(),
  handler: async (ctx, { participantId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the participation record
    const participation = await ctx.db.get(participantId)
    if (!participation) {
      throw new Error("Invitation not found")
    }

    // Verify the invitation belongs to the current user
    if (participation.userId !== currentUser._id) {
      throw new Error("You are not authorized to decline this invitation")
    }

    // Verify the participation is still in "invited" status
    if (participation.status !== "invited") {
      throw new Error("This invitation has already been processed")
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

// Delete a challenge (only creator can delete)
export const deleteChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  returns: v.null(),
  handler: async (ctx, { challengeId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the challenge
    const challenge = await ctx.db.get(challengeId)
    if (!challenge) {
      throw new Error("Challenge not found")
    }

    // Verify the current user is the creator
    if (challenge.creatorId !== currentUser._id) {
      throw new Error("Only the challenge creator can delete this challenge")
    }

    // Get all participants to notify them
    const participants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
      .collect()

    // Delete all exercise progress for this challenge
    const progress = await ctx.db
      .query("exercise_progress")
      .withIndex("by_challenge_and_user", q => q.eq("challengeId", challengeId))
      .collect()

    for (const p of progress) {
      await ctx.db.delete(p._id)
    }

    // Delete all exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
      .collect()

    for (const exercise of exercises) {
      await ctx.db.delete(exercise._id)
    }

    // Delete all participants
    for (const participant of participants) {
      await ctx.db.delete(participant._id)

      // Notify other participants (not the creator)
      if (participant.userId !== currentUser._id) {
        await ctx.scheduler.runAfter(
          0,
          internal.notifications.createNotification,
          {
            userId: participant.userId,
            message: `Challenge "${challenge.name}" has been cancelled by ${currentUser.name}`,
            type: "info" as const,
          }
        )
      }
    }

    // Delete the challenge
    await ctx.db.delete(challengeId)

    return null
  },
})

// Get past challenges with user's performance
export const getPastChallenges = query({
  args: { timezone: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("challenges"),
      name: v.string(),
      date: v.string(),
      totalExercises: v.number(),
      userCompletedReps: v.number(),
      userTotalTarget: v.number(),
      completionPercentage: v.number(),
      participantCount: v.number(),
      isCompleted: v.boolean(),
    })
  ),
  handler: async (ctx, { timezone }) => {
    const currentUser = await getCurrentUser(ctx)

    const today = timezone
      ? getTodayDateFromTimezone(timezone)
      : new Date().toISOString().split("T")[0]

    // Get all participations for the user
    const participations = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", q => q.eq("userId", currentUser._id))
      .collect()

    const challengeIds = participations.map(p => p.challengeId)

    // Get challenge details
    const pastChallenges = []

    for (const challengeId of challengeIds) {
      const challenge = await ctx.db.get(challengeId)
      if (!challenge) continue

      // Only include past challenges (before today)
      if (challenge.date >= today) continue

      // Get exercises
      const exercises = await ctx.db
        .query("exercises")
        .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
        .collect()

      // Calculate user's performance
      let userCompletedReps = 0
      let userTotalTarget = 0

      for (const exercise of exercises) {
        userTotalTarget += exercise.targetReps

        const progress = await ctx.db
          .query("exercise_progress")
          .withIndex("by_exercise_and_user", q =>
            q.eq("exerciseId", exercise._id).eq("userId", currentUser._id)
          )
          .first()

        if (progress) {
          userCompletedReps += Math.min(
            progress.completedReps,
            exercise.targetReps
          )
        }
      }

      const completionPercentage =
        userTotalTarget > 0
          ? Math.round((userCompletedReps / userTotalTarget) * 100)
          : 0

      // Get participant count
      const participants = await ctx.db
        .query("challenge_participants")
        .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
        .collect()

      pastChallenges.push({
        _id: challenge._id,
        name: challenge.name,
        date: challenge.date,
        totalExercises: exercises.length,
        userCompletedReps,
        userTotalTarget,
        completionPercentage,
        participantCount: participants.length,
        isCompleted: completionPercentage === 100,
      })
    }

    // Sort by date descending (most recent first)
    return pastChallenges.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  },
})

// Leave a challenge (for participants who are not the creator)
export const leaveChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  returns: v.null(),
  handler: async (ctx, { challengeId }) => {
    const currentUser = await getCurrentUser(ctx)

    // Get the challenge
    const challenge = await ctx.db.get(challengeId)
    if (!challenge) {
      throw new Error("Challenge not found")
    }

    // Creator cannot leave their own challenge (they should delete it instead)
    if (challenge.creatorId === currentUser._id) {
      throw new Error(
        "Challenge creators cannot leave. Delete the challenge instead."
      )
    }

    // Find the participant record
    const participation = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", q => q.eq("challengeId", challengeId))
      .filter(q => q.eq(q.field("userId"), currentUser._id))
      .first()

    if (!participation) {
      throw new Error("You are not a participant in this challenge")
    }

    // Delete exercise progress for this user in this challenge
    const progress = await ctx.db
      .query("exercise_progress")
      .withIndex("by_challenge_and_user", q =>
        q.eq("challengeId", challengeId).eq("userId", currentUser._id)
      )
      .collect()

    for (const p of progress) {
      await ctx.db.delete(p._id)
    }

    // Delete the participant record
    await ctx.db.delete(participation._id)

    // Notify the creator
    await ctx.scheduler.runAfter(0, internal.notifications.createNotification, {
      userId: challenge.creatorId,
      message: `${currentUser.name} left your challenge "${challenge.name}"`,
      type: "info" as const,
    })

    return null
  },
})
