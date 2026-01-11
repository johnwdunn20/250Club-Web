import { internalMutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

// Pool of challenge names for variety
const CHALLENGE_NAMES = [
  "Morning Pump",
  "Lunch Grind",
  "Evening Burn",
  "Full Body Blast",
  "Core Crusher",
  "Upper Body Focus",
  "Leg Day",
  "Cardio Mix",
  "Strength Session",
  "Quick HIIT",
]

// Pool of exercises with realistic rep ranges [min, max]
const EXERCISES = [
  { name: "Push-ups", minReps: 20, maxReps: 50 },
  { name: "Squats", minReps: 30, maxReps: 60 },
  { name: "Lunges", minReps: 20, maxReps: 40 },
  { name: "Burpees", minReps: 10, maxReps: 25 },
  { name: "Plank (seconds)", minReps: 30, maxReps: 60 },
  { name: "Crunches", minReps: 30, maxReps: 50 },
  { name: "Mountain Climbers", minReps: 20, maxReps: 40 },
  { name: "Jumping Jacks", minReps: 40, maxReps: 80 },
  { name: "Tricep Dips", minReps: 15, maxReps: 30 },
  { name: "Pull-ups", minReps: 5, maxReps: 15 },
]

// Helper to get random int in range [min, max]
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Get date string for N days ago
function getDateDaysAgo(daysAgo: number): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split("T")[0]
}

// Determine completion percentage based on realistic distribution
function getCompletionRate(): number {
  const rand = Math.random()
  if (rand < 0.6) {
    // 60% chance: 100% completion
    return 1.0
  } else if (rand < 0.85) {
    // 25% chance: 50-90% completion (partial)
    return 0.5 + Math.random() * 0.4
  } else {
    // 15% chance: 0-30% completion (skipped/minimal)
    return Math.random() * 0.3
  }
}

// Check if a date is a weekend
function isWeekend(dateString: string): boolean {
  const date = new Date(dateString + "T00:00:00")
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Seed historical challenge data for the past 30 days.
 * Uses existing users and creates realistic challenge/exercise/progress data.
 *
 * Run with: npx convex run seed:seedHistoricalData
 */
export const seedHistoricalData = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    stats: v.object({
      usersFound: v.number(),
      challengesCreated: v.number(),
      exercisesCreated: v.number(),
      participantsCreated: v.number(),
      progressRecordsCreated: v.number(),
    }),
  }),
  handler: async ctx => {
    // Get all existing users
    const users = await ctx.db.query("users").collect()

    if (users.length === 0) {
      return {
        success: false,
        message: "No users found. Please create users first.",
        stats: {
          usersFound: 0,
          challengesCreated: 0,
          exercisesCreated: 0,
          participantsCreated: 0,
          progressRecordsCreated: 0,
        },
      }
    }

    let challengesCreated = 0
    let exercisesCreated = 0
    let participantsCreated = 0
    let progressRecordsCreated = 0

    // Generate data for past 30 days (starting from yesterday)
    for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
      const date = getDateDaysAgo(daysAgo)

      // ~70% chance to create a challenge, less likely on weekends
      const createChallenge = isWeekend(date)
        ? Math.random() < 0.5 // 50% on weekends
        : Math.random() < 0.8 // 80% on weekdays

      if (!createChallenge) {
        continue
      }

      // Rotate challenge creator among users
      const creatorIndex = daysAgo % users.length
      const creator = users[creatorIndex]

      // Pick a random challenge name
      const challengeName =
        CHALLENGE_NAMES[randomInt(0, CHALLENGE_NAMES.length - 1)]

      // Create the challenge
      const challengeId = await ctx.db.insert("challenges", {
        name: challengeName,
        creatorId: creator._id,
        date,
        status: "active",
      })
      challengesCreated++

      // Pick 2-4 random exercises
      const exerciseCount = randomInt(2, 4)
      const shuffledExercises = shuffleArray(EXERCISES)
      const selectedExercises = shuffledExercises.slice(0, exerciseCount)

      // Create exercises
      const exerciseIds: Array<{ id: Id<"exercises">; targetReps: number }> = []
      for (let i = 0; i < selectedExercises.length; i++) {
        const exercise = selectedExercises[i]
        const targetReps = randomInt(exercise.minReps, exercise.maxReps)

        const exerciseId = await ctx.db.insert("exercises", {
          challengeId,
          name: exercise.name,
          targetReps,
          order: i,
        })
        exerciseIds.push({ id: exerciseId, targetReps })
        exercisesCreated++
      }

      // Add all users as active participants
      for (const user of users) {
        await ctx.db.insert("challenge_participants", {
          challengeId,
          userId: user._id,
          status: "active",
        })
        participantsCreated++

        // Generate exercise progress with realistic completion rates
        const completionRate = getCompletionRate()

        for (const exercise of exerciseIds) {
          // Calculate completed reps based on completion rate with some variation
          const baseCompleted = Math.floor(exercise.targetReps * completionRate)
          // Add small random variation (-5% to +5%)
          const variation = Math.floor(
            baseCompleted * (Math.random() * 0.1 - 0.05)
          )
          const completedReps = Math.max(
            0,
            Math.min(exercise.targetReps, baseCompleted + variation)
          )

          // Only create progress record if some reps were completed
          if (completedReps > 0) {
            await ctx.db.insert("exercise_progress", {
              exerciseId: exercise.id,
              userId: user._id,
              challengeId,
              completedReps,
            })
            progressRecordsCreated++
          }
        }
      }
    }

    return {
      success: true,
      message: `Successfully seeded historical data for ${users.length} users over 30 days.`,
      stats: {
        usersFound: users.length,
        challengesCreated,
        exercisesCreated,
        participantsCreated,
        progressRecordsCreated,
      },
    }
  },
})

/**
 * Clear all seeded data (challenges, exercises, participants, progress).
 * WARNING: This will delete ALL challenge-related data!
 *
 * Run with: npx convex run seed:clearAllChallengeData
 */
export const clearAllChallengeData = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    stats: v.object({
      challengesDeleted: v.number(),
      exercisesDeleted: v.number(),
      participantsDeleted: v.number(),
      progressDeleted: v.number(),
    }),
  }),
  handler: async ctx => {
    // Delete all exercise progress
    const progress = await ctx.db.query("exercise_progress").collect()
    for (const p of progress) {
      await ctx.db.delete(p._id)
    }

    // Delete all exercises
    const exercises = await ctx.db.query("exercises").collect()
    for (const e of exercises) {
      await ctx.db.delete(e._id)
    }

    // Delete all challenge participants
    const participants = await ctx.db.query("challenge_participants").collect()
    for (const p of participants) {
      await ctx.db.delete(p._id)
    }

    // Delete all challenges
    const challenges = await ctx.db.query("challenges").collect()
    for (const c of challenges) {
      await ctx.db.delete(c._id)
    }

    return {
      success: true,
      message: "All challenge data has been cleared.",
      stats: {
        challengesDeleted: challenges.length,
        exercisesDeleted: exercises.length,
        participantsDeleted: participants.length,
        progressDeleted: progress.length,
      },
    }
  },
})
