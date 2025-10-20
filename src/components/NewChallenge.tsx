"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Combobox, ComboboxOption } from "./ui/combobox";

interface Exercise {
  name: string;
  targetReps: number;
}

export default function NewChallenge() {
  const [challengeName, setChallengeName] = useState("");
  const [selectedDate, setSelectedDate] = useState("today");
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", targetReps: 0 },
  ]);
  const [selectedFriends, setSelectedFriends] = useState<Id<"users">[]>([]);
  const [friendSearchTerm, setFriendSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convex queries
  const friends = useQuery(api.friendships.getFriends);
  const userChallenges = useQuery(api.challenges.getUserChallenges);

  // Convex mutations
  const createChallenge = useMutation(api.challenges.createChallenge);

  // Filter friends based on search term
  const filteredFriends = useMemo(() => {
    if (!friends) return [];
    if (!friendSearchTerm.trim()) return friends;

    const searchLower = friendSearchTerm.toLowerCase();
    return friends.filter(
      (friend) =>
        friend.friend?.name?.toLowerCase().includes(searchLower) ||
        friend.friend?.email?.toLowerCase().includes(searchLower)
    );
  }, [friends, friendSearchTerm]);

  // Get today's and tomorrow's date strings in the current user's timezone
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    .toISOString()
    .split("T")[0];
  const tomorrow = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  )
    .toISOString()
    .split("T")[0];

  // Date options for the combobox
  const dateOptions: ComboboxOption[] = [
    { value: "today", label: `Today (${today})` },
    { value: "tomorrow", label: `Tomorrow (${tomorrow})` },
  ];

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", targetReps: 0 }]);
  };

  const handleRemoveExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index));
    }
  };

  const handleExerciseChange = (
    index: number,
    field: keyof Exercise,
    value: string | number
  ) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const handleFriendToggle = (friendId: Id<"users">) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!challengeName.trim()) {
      toast.error("Please enter a challenge name");
      return;
    }

    const validExercises = exercises.filter(
      (ex) => ex.name.trim() && ex.targetReps > 0
    );
    if (validExercises.length === 0) {
      toast.error("Please add at least one exercise with valid name and reps");
      return;
    }

    setIsSubmitting(true);

    try {
      const targetDate = selectedDate === "today" ? today : tomorrow;

      await createChallenge({
        name: challengeName.trim(),
        date: targetDate,
        exercises: validExercises,
        friendIds: selectedFriends,
      });

      toast.success("Challenge created successfully!");

      // Reset form
      setChallengeName("");
      setSelectedDate("today");
      setExercises([{ name: "", targetReps: 0 }]);
      setSelectedFriends([]);
      setFriendSearchTerm("");
    } catch (error) {
      console.error("Failed to create challenge:", error);
      toast.error("Failed to create challenge. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-mobile">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create a Challenge
        </h2>
        <p className="text-muted-foreground mb-6">
          Challenge yourself or your friends to reach new fitness goals
        </p>

        {/* Challenge form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Challenge Name
            </label>
            <input
              type="text"
              placeholder="e.g., Weekend Warrior"
              value={challengeName}
              onChange={(e) => setChallengeName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Date
            </label>
            <Combobox
              options={dateOptions}
              value={selectedDate}
              onValueChange={setSelectedDate}
              placeholder="Select target date..."
              searchPlaceholder="Search dates..."
              emptyText="No dates found."
              className="w-full"
            />
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Exercises
              </label>
              <button
                type="button"
                onClick={handleAddExercise}
                className="px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                + Add Exercise
              </button>
            </div>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Exercise name"
                      value={exercise.name}
                      onChange={(e) =>
                        handleExerciseChange(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Reps"
                      value={exercise.targetReps || ""}
                      onChange={(e) =>
                        handleExerciseChange(
                          index,
                          "targetReps",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                      min="1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(index)}
                    disabled={exercises.length === 1}
                    className="px-3 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Friend Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Invite Friends ({selectedFriends.length} selected)
            </label>
            {friends && friends.length > 0 ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search friends..."
                  value={friendSearchTerm}
                  onChange={(e) => setFriendSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
                />
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredFriends.map((friendship) => (
                    <label
                      key={friendship._id}
                      className="flex items-center p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friendship.friendId)}
                        onChange={() => handleFriendToggle(friendship.friendId)}
                        className="mr-3"
                      />
                      <div>
                        <div className="font-medium text-foreground">
                          {friendship.friend?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {friendship.friend?.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                <p className="text-sm text-muted-foreground">
                  No friends yet. Add friends first to invite them to
                  challenges.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg hover:scale-105 active:scale-95 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Challenge"}
          </button>
        </form>
      </div>

      {/* Active challenges */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Your Challenges
        </h3>
        <div className="space-y-3">
          {userChallenges && userChallenges.length > 0 ? (
            userChallenges.map((challenge) => (
              <div
                key={challenge._id}
                className="p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-foreground">
                    {challenge.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {challenge.date}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {challenge.exercises.length} exercises •{" "}
                  {challenge.participantCount} participants
                </div>
                <div className="text-xs text-muted-foreground">
                  Status: {challenge.userStatus} • Created by:{" "}
                  {challenge.creator?.name}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-foreground">
                  No challenges yet
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Create your first challenge to get started!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
