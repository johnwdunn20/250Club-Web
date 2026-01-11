"use client"

import { useState, useEffect, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import type {
  TodaysChallenges,
  Exercise,
  ChallengeParticipant,
  StreakData,
  PendingInvitation,
} from "@/types/convex"
import StreakCard from "./StreakCard"
import PendingInvitationsCard from "./PendingInvitationsCard"
import { Button } from "./ui/button"
import { toast } from "sonner"

interface TodaysWorkoutProps {
  todaysChallenges: TodaysChallenges | undefined
  streak: StreakData | undefined
  pendingInvitations: PendingInvitation[] | undefined
  onNavigateToTab?: (tab: string) => void
}

export default function TodaysWorkout({
  todaysChallenges,
  streak,
  pendingInvitations,
  onNavigateToTab,
}: TodaysWorkoutProps) {
  const updateProgress = useMutation(api.challenges.updateExerciseProgress)
  const acceptInvitation = useMutation(api.challenges.acceptChallengeInvitation)
  const declineInvitation = useMutation(
    api.challenges.declineChallengeInvitation
  )

  const [localProgress, setLocalProgress] = useState<Record<string, number>>({})
  const throttleTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Initialize local progress when data loads
  useEffect(() => {
    if (todaysChallenges && todaysChallenges.length > 0) {
      const initialProgress: Record<string, number> = {}
      todaysChallenges.forEach(challenge => {
        challenge.exercises.forEach((exercise: Exercise) => {
          const userProgress = challenge.participants
            .find(
              (p: ChallengeParticipant) => p.userId === challenge.currentUserId
            )
            ?.exerciseProgress.find(
              (ep: { exerciseId: string }) => ep.exerciseId === exercise._id
            )
          initialProgress[exercise._id] = userProgress?.completedReps || 0
        })
      })
      setLocalProgress(initialProgress)
    }
  }, [todaysChallenges])

  // Cleanup timeouts on unmount to prevent memory leaks
  useEffect(() => {
    const timeouts = throttleTimeoutsRef.current
    return () => {
      // Clear all pending timeouts on unmount
      Object.values(timeouts).forEach(clearTimeout)
    }
  }, []) // Empty deps - only cleanup on unmount

  const handleAcceptInvitation = async (
    participantId: Id<"challenge_participants">
  ) => {
    try {
      await acceptInvitation({ participantId })
      toast.success("Challenge invitation accepted!")
    } catch (error) {
      console.error("Failed to accept invitation:", error)
      toast.error("Failed to accept invitation")
    }
  }

  const handleDeclineInvitation = async (
    participantId: Id<"challenge_participants">
  ) => {
    try {
      await declineInvitation({ participantId })
      toast.info("Challenge invitation declined")
    } catch (error) {
      console.error("Failed to decline invitation:", error)
      toast.error("Failed to decline invitation")
    }
  }

  const handleRepChange = (exerciseId: Id<"exercises">, newValue: number) => {
    // Update local state immediately for responsive UI
    setLocalProgress(prev => ({ ...prev, [exerciseId]: newValue }))

    // Clear existing timeout for this exercise
    if (throttleTimeoutsRef.current[exerciseId]) {
      clearTimeout(throttleTimeoutsRef.current[exerciseId])
    }

    // Set new timeout - only send the latest value after 200ms of no changes
    const timeout = setTimeout(() => {
      updateProgress({ exerciseId, completedReps: newValue })
    }, 200)

    throttleTimeoutsRef.current[exerciseId] = timeout
  }

  const incrementReps = (exerciseId: Id<"exercises">) => {
    const currentValue = localProgress[exerciseId] || 0
    handleRepChange(exerciseId, currentValue + 1)
  }

  const decrementReps = (exerciseId: Id<"exercises">) => {
    const currentValue = localProgress[exerciseId] || 0
    if (currentValue > 0) {
      handleRepChange(exerciseId, currentValue - 1)
    }
  }

  // Still loading - return null (fast backend, avoid flash of empty state)
  if (todaysChallenges === undefined) {
    return null
  }

  // No challenge today (confirmed by data)
  if (todaysChallenges.length === 0) {
    return (
      <div className="space-y-6">
        <PendingInvitationsCard
          pendingInvitations={pendingInvitations}
          onAccept={handleAcceptInvitation}
          onDecline={handleDeclineInvitation}
        />
        <div className="card-mobile text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No Challenge Today
          </h2>
          <p className="text-muted-foreground mb-6">
            There&apos;s no active challenge scheduled for today. Create a new
            challenge or check back tomorrow!
          </p>
          {onNavigateToTab && (
            <Button
              onClick={() => onNavigateToTab("challenge")}
              className="mx-auto"
            >
              Create a Challenge
            </Button>
          )}
        </div>
        <StreakCard
          currentStreak={streak?.currentStreak ?? 0}
          longestStreak={streak?.longestStreak ?? 0}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Pending invitations */}
      <PendingInvitationsCard
        pendingInvitations={pendingInvitations}
        onAccept={handleAcceptInvitation}
        onDecline={handleDeclineInvitation}
      />

      {/* Render each challenge */}
      {todaysChallenges.map(todaysChallenge => {
        // Find current user's progress for this challenge
        const currentUserParticipant = todaysChallenge.participants.find(
          (p: ChallengeParticipant) =>
            p.userId === todaysChallenge.currentUserId
        )
        const userTotalCompleted = currentUserParticipant?.totalCompleted || 0
        const userTotalTarget = currentUserParticipant?.totalTarget || 0

        // Calculate completion percentage by averaging individual exercise completion rates
        const exerciseCount = todaysChallenge.exercises.length
        const userCompletionPercentage =
          exerciseCount > 0
            ? Math.round(
                todaysChallenge.exercises.reduce(
                  (sum: number, exercise: Exercise) => {
                    const completedReps = localProgress[exercise._id] || 0
                    const exercisePercentage = Math.min(
                      (completedReps / exercise.targetReps) * 100,
                      100
                    )
                    return sum + exercisePercentage
                  },
                  0
                ) / exerciseCount
              )
            : 0

        // Sort participants by total completed (descending)
        const sortedParticipants = [...todaysChallenge.participants].sort(
          (a, b) => b.totalCompleted - a.totalCompleted
        )

        return (
          <div key={todaysChallenge._id} className="space-y-6">
            <div className="card-mobile">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {todaysChallenge.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {new Date(todaysChallenge.date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                  {userTotalCompleted} / {userTotalTarget}
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Complete all exercises to maintain your streak
              </p>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => {
                    // Batch all state updates together to avoid race conditions
                    const updates: Record<string, number> = {}
                    todaysChallenge.exercises.forEach((exercise: Exercise) => {
                      updates[exercise._id] = exercise.targetReps
                    })
                    setLocalProgress(prev => ({ ...prev, ...updates }))

                    // Clear any existing timeouts and set one batch timeout
                    Object.values(throttleTimeoutsRef.current).forEach(
                      clearTimeout
                    )
                    const timeout = setTimeout(() => {
                      todaysChallenge.exercises.forEach(
                        (exercise: Exercise) => {
                          updateProgress({
                            exerciseId: exercise._id,
                            completedReps: exercise.targetReps,
                          })
                        }
                      )
                    }, 200)
                    throttleTimeoutsRef.current["batch"] = timeout
                    toast.success("All exercises marked complete!")
                  }}
                  className="px-3 py-1.5 text-sm bg-green-500/10 text-green-600 rounded-full hover:bg-green-500/20 transition-colors border border-green-500/20"
                >
                  ✓ Complete All
                </button>
              </div>

              {/* Interactive exercise cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {todaysChallenge.exercises.map((exercise: Exercise) => {
                  const completedReps = localProgress[exercise._id] || 0
                  const isCompleted = completedReps >= exercise.targetReps

                  return (
                    <div
                      key={exercise._id}
                      className={`text-center p-4 rounded-lg transition-all ${
                        isCompleted
                          ? "bg-green-500/10 border-2 border-green-500/20"
                          : "bg-secondary/10"
                      }`}
                    >
                      <div className="text-sm text-muted-foreground mb-2">
                        {exercise.name}
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <button
                          onClick={() => decrementReps(exercise._id)}
                          className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-lg font-bold transition-all"
                          disabled={completedReps === 0}
                          aria-label={`Decrease ${exercise.name} reps`}
                        >
                          -
                        </button>
                        <div className="min-w-[60px] text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {completedReps}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            / {exercise.targetReps}
                          </div>
                        </div>
                        <button
                          onClick={() => incrementReps(exercise._id)}
                          className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center text-lg font-bold transition-all"
                          aria-label={`Increase ${exercise.name} reps`}
                        >
                          +
                        </button>
                      </div>
                      {/* Quick complete button for individual exercise */}
                      <button
                        onClick={() =>
                          handleRepChange(
                            exercise._id,
                            isCompleted ? 0 : exercise.targetReps
                          )
                        }
                        className={`text-xs font-semibold ${
                          isCompleted
                            ? "text-green-600"
                            : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {isCompleted ? "✓ Complete!" : "Quick complete"}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progress</span>
                  <span>{userCompletionPercentage}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
                    style={{ width: `${userCompletionPercentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Participants leaderboard */}
            <div className="card-mobile">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Participants
              </h3>
              <div className="space-y-3">
                {sortedParticipants.map((participant, index) => {
                  const isCurrentUser =
                    participant.userId === currentUserParticipant?.userId
                  const isCompleted = participant.completionPercentage === 100

                  return (
                    <div
                      key={participant.userId}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        isCurrentUser
                          ? "bg-primary/10 border-2 border-primary/20"
                          : "bg-muted/20"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">
                            {participant.user?.name}
                            {isCurrentUser && (
                              <span className="text-primary ml-2">(You)</span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {participant.totalCompleted} /{" "}
                            {participant.totalTarget} reps
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {participant.completionPercentage}%
                        </div>
                        {isCompleted && (
                          <div className="text-xs text-green-600 font-semibold">
                            Complete!
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {/* Current streak card */}
      <StreakCard
        currentStreak={streak?.currentStreak ?? 0}
        longestStreak={streak?.longestStreak ?? 0}
      />
    </div>
  )
}
