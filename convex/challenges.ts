import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getTodayDateFromTimezone } from "./utils";

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
  handler: async (ctx, { name, date, exercises, friendIds }) => {
    const currentUser = await getCurrentUser(ctx);

    // Validate exercises array
    if (exercises.length === 0) {
      throw new Error("At least one exercise is required");
    }

    // Validate exercise data
    for (const exercise of exercises) {
      if (!exercise.name.trim()) {
        throw new Error("Exercise name cannot be empty");
      }
      if (exercise.targetReps <= 0) {
        throw new Error("Target reps must be greater than 0");
      }
    }

    // Create the challenge
    const challengeId = await ctx.db.insert("challenges", {
      name: name.trim(),
      creatorId: currentUser._id,
      date,
      status: "active",
    });

    // Create exercises
    const exerciseIds = [];
    for (let i = 0; i < exercises.length; i++) {
      const exerciseId = await ctx.db.insert("exercises", {
        challengeId,
        name: exercises[i].name.trim(),
        targetReps: exercises[i].targetReps,
        order: i,
      });
      exerciseIds.push(exerciseId);
    }

    // Create challenge participants
    // Creator is automatically active
    await ctx.db.insert("challenge_participants", {
      challengeId,
      userId: currentUser._id,
      status: "active",
    });

    // Invited friends get invited status
    for (const friendId of friendIds) {
      // Verify friend exists and is actually a friend
      const friend = await ctx.db.get(friendId);
      if (!friend) {
        throw new Error("One or more selected friends not found");
      }

      // Check if friendship exists
      const friendship = await ctx.db
        .query("friendships")
        .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
        .filter((q) => q.eq(q.field("friendId"), friendId))
        .first();

      if (!friendship) {
        throw new Error("One or more selected users are not your friends");
      }

      await ctx.db.insert("challenge_participants", {
        challengeId,
        userId: friendId,
        status: "invited",
      });
    }

    return { challengeId, exerciseIds };
  },
});

// Get user's challenges (active and completed)
export const getUserChallenges = query({
  args: {},
  handler: async (ctx) => {
    const currentUser = await getCurrentUser(ctx);

    // Get challenges where user is a participant
    const participants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const challengeIds = participants.map((p) => p.challengeId);

    // Get challenge details
    const challenges = await Promise.all(
      challengeIds.map(async (challengeId) => {
        const challenge = await ctx.db.get(challengeId);
        if (!challenge) return null;

        // Get exercises for this challenge
        const exercises = await ctx.db
          .query("exercises")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
          .collect();

        // Get participant count
        const allParticipants = await ctx.db
          .query("challenge_participants")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
          .collect();

        // Get creator info
        const creator = await ctx.db.get(challenge.creatorId);

        return {
          ...challenge,
          exercises,
          participantCount: allParticipants.length,
          creator,
          userStatus: participants.find((p) => p.challengeId === challengeId)
            ?.status,
        };
      })
    );

    // Filter out null challenges and sort by date (newest first)
    return challenges
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
});

// Get challenge details by ID
export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, { challengeId }) => {
    const currentUser = await getCurrentUser(ctx);

    const challenge = await ctx.db.get(challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    // Check if user is a participant
    const participation = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
      .filter((q) => q.eq(q.field("userId"), currentUser._id))
      .first();

    if (!participation) {
      throw new Error("You are not a participant in this challenge");
    }

    // Get exercises
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
      .collect();

    // Get all participants
    const participants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
      .collect();

    // Get participant details
    const participantsWithUsers = await Promise.all(
      participants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);
        return {
          ...participant,
          user,
        };
      })
    );

    // Get creator info
    const creator = await ctx.db.get(challenge.creatorId);

    return {
      ...challenge,
      exercises: exercises.sort((a, b) => a.order - b.order),
      participants: participantsWithUsers,
      creator,
      userStatus: participation.status,
    };
  },
});

// Get today's challenge for the current user
export const getTodaysChallenge = query({
  args: { timezone: v.optional(v.string()) },
  handler: async (ctx, { timezone }) => {
    const currentUser = await getCurrentUser(ctx);

    // Get today's date in YYYY-MM-DD format (user's timezone if provided, otherwise UTC fallback)
    const today = timezone
      ? getTodayDateFromTimezone(timezone)
      : new Date().toISOString().split("T")[0];
    console.log("today", today);

    // Find challenges for today where user is a participant
    const participants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_user", (q) => q.eq("userId", currentUser._id))
      .collect();

    const challengeIds = participants.map((p) => p.challengeId);

    // Find today's challenge
    let todaysChallenge = null;
    for (const challengeId of challengeIds) {
      const challenge = await ctx.db.get(challengeId);
      if (
        challenge &&
        challenge.date === today &&
        challenge.status === "active"
      ) {
        todaysChallenge = challenge;
        break;
      }
    }

    if (!todaysChallenge) {
      return null;
    }

    // Get exercises for this challenge
    const exercises = await ctx.db
      .query("exercises")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", todaysChallenge._id)
      )
      .collect();

    // Get all participants
    const allParticipants = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", todaysChallenge._id)
      )
      .collect();

    // Get participant details with their progress
    const participantsWithProgress = await Promise.all(
      allParticipants.map(async (participant) => {
        const user = await ctx.db.get(participant.userId);

        // Get user's progress for each exercise
        const exerciseProgress = await Promise.all(
          exercises.map(async (exercise) => {
            const progress = await ctx.db
              .query("exercise_progress")
              .withIndex("by_exercise_and_user", (q) =>
                q
                  .eq("exerciseId", exercise._id)
                  .eq("userId", participant.userId)
              )
              .first();

            return {
              exerciseId: exercise._id,
              exerciseName: exercise.name,
              targetReps: exercise.targetReps,
              completedReps: progress?.completedReps || 0,
            };
          })
        );

        // Calculate totals
        const totalCompleted = exerciseProgress.reduce(
          (sum, ep) => sum + ep.completedReps,
          0
        );
        const totalTarget = exerciseProgress.reduce(
          (sum, ep) => sum + ep.targetReps,
          0
        );
        const completionPercentage =
          totalTarget > 0
            ? Math.round((totalCompleted / totalTarget) * 100)
            : 0;

        return {
          ...participant,
          user,
          exerciseProgress,
          totalCompleted,
          totalTarget,
          completionPercentage,
        };
      })
    );

    // Get creator info
    const creator = await ctx.db.get(todaysChallenge.creatorId);

    return {
      ...todaysChallenge,
      exercises: exercises.sort((a, b) => a.order - b.order),
      participants: participantsWithProgress,
      creator,
      currentUserId: currentUser._id,
    };
  },
});

// Update exercise progress for the current user
export const updateExerciseProgress = mutation({
  args: {
    exerciseId: v.id("exercises"),
    completedReps: v.number(),
  },
  handler: async (ctx, { exerciseId, completedReps }) => {
    const currentUser = await getCurrentUser(ctx);

    // Validate completed reps
    if (completedReps < 0) {
      throw new Error("Completed reps cannot be negative");
    }

    // Get the exercise to find the challenge
    const exercise = await ctx.db.get(exerciseId);
    if (!exercise) {
      throw new Error("Exercise not found");
    }

    // Check if user is a participant in this challenge
    const participation = await ctx.db
      .query("challenge_participants")
      .withIndex("by_challenge", (q) =>
        q.eq("challengeId", exercise.challengeId)
      )
      .filter((q) => q.eq(q.field("userId"), currentUser._id))
      .first();

    if (!participation) {
      throw new Error("You are not a participant in this challenge");
    }

    // Check if progress already exists
    const existingProgress = await ctx.db
      .query("exercise_progress")
      .withIndex("by_exercise_and_user", (q) =>
        q.eq("exerciseId", exerciseId).eq("userId", currentUser._id)
      )
      .first();

    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        completedReps,
      });
      return existingProgress._id;
    } else {
      // Create new progress
      return await ctx.db.insert("exercise_progress", {
        exerciseId,
        userId: currentUser._id,
        challengeId: exercise.challengeId,
        completedReps,
      });
    }
  },
});
