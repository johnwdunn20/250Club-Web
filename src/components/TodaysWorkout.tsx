"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export default function TodaysWorkout() {
  const todaysChallenge = useQuery(api.challenges.getTodaysChallenge);
  const updateProgress = useMutation(api.challenges.updateExerciseProgress);

  const [localProgress, setLocalProgress] = useState<Record<string, number>>(
    {}
  );
  const [debounceTimeouts, setDebounceTimeouts] = useState<
    Record<string, NodeJS.Timeout>
  >({});

  // Initialize local progress when data loads
  useEffect(() => {
    if (todaysChallenge) {
      const initialProgress: Record<string, number> = {};
      todaysChallenge.exercises.forEach((exercise) => {
        const userProgress = todaysChallenge.participants
          .find((p) => p.userId === todaysChallenge.currentUserId)
          ?.exerciseProgress.find((ep) => ep.exerciseId === exercise._id);
        initialProgress[exercise._id] = userProgress?.completedReps || 0;
      });
      setLocalProgress(initialProgress);
    }
  }, [todaysChallenge]);

  const handleRepChange = (exerciseId: Id<"exercises">, newValue: number) => {
    // Update local state immediately for responsive UI
    setLocalProgress((prev) => ({ ...prev, [exerciseId]: newValue }));

    // Clear existing timeout for this exercise
    if (debounceTimeouts[exerciseId]) {
      clearTimeout(debounceTimeouts[exerciseId]);
    }

    // Set new timeout to update backend
    const timeout = setTimeout(() => {
      updateProgress({ exerciseId, completedReps: newValue });
    }, 500);

    setDebounceTimeouts((prev) => ({ ...prev, [exerciseId]: timeout }));
  };

  const incrementReps = (exerciseId: Id<"exercises">) => {
    const currentValue = localProgress[exerciseId] || 0;
    handleRepChange(exerciseId, currentValue + 1);
  };

  const decrementReps = (exerciseId: Id<"exercises">) => {
    const currentValue = localProgress[exerciseId] || 0;
    if (currentValue > 0) {
      handleRepChange(exerciseId, currentValue - 1);
    }
  };

  // Loading state
  if (todaysChallenge === undefined) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="card-mobile">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-6"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-3 bg-muted rounded mb-6"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // No challenge today
  if (!todaysChallenge) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="card-mobile text-center">
          <div className="text-6xl mb-4">📅</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No Challenge Today
          </h2>
          <p className="text-muted-foreground mb-6">
            There&apos;s no active challenge scheduled for today. Create a new
            challenge or check back tomorrow!
          </p>
          <button className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95">
            Create Challenge
          </button>
        </div>
      </div>
    );
  }

  // Find current user's progress
  const currentUser = todaysChallenge.participants.find(
    (p) => p.userId === todaysChallenge.currentUserId
  );
  const userTotalCompleted = currentUser?.totalCompleted || 0;
  const userTotalTarget = currentUser?.totalTarget || 0;
  const userCompletionPercentage = currentUser?.completionPercentage || 0;

  // Sort participants by total completed (descending)
  const sortedParticipants = [...todaysChallenge.participants].sort(
    (a, b) => b.totalCompleted - a.totalCompleted
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-mobile">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {todaysChallenge.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {new Date(todaysChallenge.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
            {userTotalCompleted} / {userTotalTarget}
          </div>
        </div>
        <p className="text-muted-foreground mb-6">
          Complete all exercises to maintain your streak
        </p>

        {/* Interactive exercise cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {todaysChallenge.exercises.map((exercise) => {
            const completedReps = localProgress[exercise._id] || 0;
            const isCompleted = completedReps >= exercise.targetReps;

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
                  >
                    +
                  </button>
                </div>
                {isCompleted && (
                  <div className="text-xs text-green-600 font-semibold">
                    ✓ Complete!
                  </div>
                )}
              </div>
            );
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
        <h3 className="text-xl font-bold text-foreground mb-4">Participants</h3>
        <div className="space-y-3">
          {sortedParticipants.map((participant, index) => {
            const isCurrentUser = participant.userId === currentUser?.userId;
            const isCompleted = participant.completionPercentage === 100;

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
                      {participant.totalCompleted} / {participant.totalTarget}{" "}
                      reps
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
            );
          })}
        </div>
      </div>

      {/* Current streak card */}
      <div className="card-mobile bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">
              Current Streak
            </div>
            <div className="text-4xl font-bold text-foreground">0 days</div>
          </div>
          <div className="text-6xl">🔥</div>
        </div>
      </div>
    </div>
  );
}
