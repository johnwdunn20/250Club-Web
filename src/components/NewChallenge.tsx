"use client"

import { useState, useMemo } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Progress } from "./ui/progress"
import {
  getTodayDate,
  getDateString,
  formatDateDisplay,
  formatDateDisplayWithRelative,
} from "@/lib/utils"
import type { Friends, UserChallenges } from "@/types/convex"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Exercise {
  name: string
  targetReps: number
}

interface PastChallenge {
  _id: string
  name: string
  date: string
  totalExercises: number
  userCompletedReps: number
  userTotalTarget: number
  completionPercentage: number
  participantCount: number
  isCompleted: boolean
}

interface NewChallengeProps {
  friends: Friends | undefined
  userChallenges: UserChallenges | undefined
  pastChallenges: PastChallenge[] | undefined
  onNavigateToTab?: (tab: string) => void
}

// Preset exercise templates
const EXERCISE_TEMPLATES = [
  {
    name: "250 Club Classic",
    exercises: [
      { name: "Push-ups", targetReps: 50 },
      { name: "Squats", targetReps: 50 },
      { name: "Sit-ups", targetReps: 50 },
      { name: "Lunges", targetReps: 50 },
      { name: "Burpees", targetReps: 50 },
    ],
  },
  {
    name: "Upper Body Blast",
    exercises: [
      { name: "Push-ups", targetReps: 100 },
      { name: "Diamond Push-ups", targetReps: 50 },
      { name: "Pike Push-ups", targetReps: 50 },
      { name: "Tricep Dips", targetReps: 50 },
    ],
  },
  {
    name: "Core Crusher",
    exercises: [
      { name: "Sit-ups", targetReps: 75 },
      { name: "Crunches", targetReps: 75 },
      { name: "Leg Raises", targetReps: 50 },
      { name: "Plank (seconds)", targetReps: 50 },
    ],
  },
  {
    name: "Leg Day",
    exercises: [
      { name: "Squats", targetReps: 100 },
      { name: "Lunges", targetReps: 50 },
      { name: "Jump Squats", targetReps: 50 },
      { name: "Calf Raises", targetReps: 50 },
    ],
  },
  {
    name: "Quick HIIT",
    exercises: [
      { name: "Burpees", targetReps: 30 },
      { name: "Mountain Climbers", targetReps: 50 },
      { name: "Jumping Jacks", targetReps: 100 },
      { name: "High Knees", targetReps: 70 },
    ],
  },
]

export default function NewChallenge({
  friends,
  userChallenges,
  pastChallenges,
  onNavigateToTab,
}: NewChallengeProps) {
  const [challengeName, setChallengeName] = useState("")
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", targetReps: 0 },
  ])
  const [selectedFriends, setSelectedFriends] = useState<Id<"users">[]>([])
  const [friendSearchTerm, setFriendSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean
    challengeId: Id<"challenges"> | null
    challengeName: string
    action: "delete" | "leave"
    isCreator: boolean
  }>({
    isOpen: false,
    challengeId: null,
    challengeName: "",
    action: "delete",
    isCreator: false,
  })

  // Get current user to determine if they're the creator
  const currentUser = useQuery(api.users.getCurrentUserInfo)

  // Convex mutations
  const createChallenge = useMutation(api.challenges.createChallenge)
  const deleteChallenge = useMutation(api.challenges.deleteChallenge)
  const leaveChallenge = useMutation(api.challenges.leaveChallenge)

  // Filter friends based on search term
  const filteredFriends = useMemo(() => {
    if (!friends) return []
    if (!friendSearchTerm.trim()) return friends

    const searchLower = friendSearchTerm.toLowerCase()
    return friends.filter(
      friend =>
        friend.friend?.name?.toLowerCase().includes(searchLower) ||
        friend.friend?.email?.toLowerCase().includes(searchLower)
    )
  }, [friends, friendSearchTerm])

  // Get today's date for min date validation
  const today = getTodayDate()

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", targetReps: 0 }])
  }

  const handleRemoveExercise = (index: number) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((_, i) => i !== index))
    }
  }

  const handleExerciseChange = (
    index: number,
    field: keyof Exercise,
    value: string | number
  ) => {
    const newExercises = [...exercises]
    newExercises[index] = { ...newExercises[index], [field]: value }
    setExercises(newExercises)
  }

  const handleFriendToggle = (friendId: Id<"users">) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const applyTemplate = (
    template: (typeof EXERCISE_TEMPLATES)[0],
    setNameToo: boolean = true
  ) => {
    setExercises(template.exercises)
    if (setNameToo && !challengeName) {
      setChallengeName(template.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!challengeName.trim()) {
      toast.error("Please enter a challenge name")
      return
    }

    const validExercises = exercises.filter(
      ex => ex.name.trim() && ex.targetReps > 0
    )
    if (validExercises.length === 0) {
      toast.error("Please add at least one exercise with valid name and reps")
      return
    }

    setIsSubmitting(true)

    try {
      await createChallenge({
        name: challengeName.trim(),
        date: selectedDate,
        exercises: validExercises,
        friendIds: selectedFriends,
      })

      toast.success("Challenge created successfully!")

      // Reset form
      setChallengeName("")
      setSelectedDate(getTodayDate())
      setExercises([{ name: "", targetReps: 0 }])
      setSelectedFriends([])
      setFriendSearchTerm("")
    } catch (error) {
      console.error("Failed to create challenge:", error)
      toast.error("Failed to create challenge. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChallengeAction = (
    challengeId: Id<"challenges">,
    challengeName: string,
    creatorId: Id<"users"> | undefined
  ) => {
    const isCreator = currentUser?._id === creatorId
    setConfirmAction({
      isOpen: true,
      challengeId,
      challengeName,
      action: isCreator ? "delete" : "leave",
      isCreator,
    })
  }

  const confirmChallengeAction = async () => {
    if (!confirmAction.challengeId) return

    try {
      if (confirmAction.action === "delete") {
        await deleteChallenge({ challengeId: confirmAction.challengeId })
        toast.success("Challenge deleted successfully")
      } else {
        await leaveChallenge({ challengeId: confirmAction.challengeId })
        toast.info("You have left the challenge")
      }
    } catch (error) {
      console.error("Failed to process challenge action:", error)
      toast.error(
        `Failed to ${confirmAction.action === "delete" ? "delete" : "leave"} challenge`
      )
    } finally {
      setConfirmAction({
        isOpen: false,
        challengeId: null,
        challengeName: "",
        action: "delete",
        isCreator: false,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-mobile">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Create a Challenge
        </h2>
        <p className="text-muted-foreground mb-6">
          Challenge yourself or your friends to reach new fitness goals
        </p>

        {/* Quick templates */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Quick Start Templates
          </label>
          <div className="flex flex-wrap gap-2">
            {EXERCISE_TEMPLATES.map((template, index) => (
              <Button
                key={index}
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => applyTemplate(template)}
                className="rounded-full"
              >
                {template.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Challenge form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Challenge Name
            </label>
            <Input
              type="text"
              placeholder="e.g., Weekend Warrior"
              value={challengeName}
              onChange={e => setChallengeName(e.target.value)}
              className="h-11"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Target Date
            </label>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={selectedDate}
                min={today}
                onChange={e => setSelectedDate(e.target.value)}
                className="flex-1 h-11"
              />
              <span className="text-sm text-muted-foreground hidden sm:block">
                {formatDateDisplayWithRelative(selectedDate)}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(today)}
                className={selectedDate === today ? "border-primary" : ""}
              >
                Today
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(getDateString(1))}
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(getDateString(7))}
              >
                +1 Week
              </Button>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Exercises
              </label>
              <Button type="button" size="sm" onClick={handleAddExercise}>
                + Add Exercise
              </Button>
            </div>
            <div className="space-y-3">
              {exercises.map((exercise, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Exercise name"
                      value={exercise.name}
                      onChange={e =>
                        handleExerciseChange(index, "name", e.target.value)
                      }
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      placeholder="Reps"
                      value={exercise.targetReps || ""}
                      onChange={e =>
                        handleExerciseChange(
                          index,
                          "targetReps",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveExercise(index)}
                    disabled={exercises.length === 1}
                  >
                    Remove
                  </Button>
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
                <Input
                  type="text"
                  placeholder="Search friends..."
                  value={friendSearchTerm}
                  onChange={e => setFriendSearchTerm(e.target.value)}
                  className="h-11"
                />
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredFriends.map(friendship => (
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
                <p className="text-sm text-muted-foreground mb-3">
                  No friends yet. Add friends first to invite them to
                  challenges.
                </p>
                {onNavigateToTab && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateToTab("friends")}
                  >
                    Find Friends
                  </Button>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full mt-6"
          >
            {isSubmitting ? "Creating..." : "Create Challenge"}
          </Button>
        </form>
      </div>

      {/* Active challenges */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Active & Upcoming Challenges
        </h3>
        <div className="space-y-3">
          {userChallenges && userChallenges.length > 0 ? (
            userChallenges.map(challenge => {
              const isCreator = currentUser?._id === challenge.creator?._id
              return (
                <div
                  key={challenge._id}
                  className="p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-foreground">
                      {challenge.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">
                        {challenge.date}
                      </div>
                      <Button
                        variant={isCreator ? "destructive" : "ghost"}
                        size="sm"
                        onClick={() =>
                          handleChallengeAction(
                            challenge._id,
                            challenge.name,
                            challenge.creator?._id
                          )
                        }
                        className="h-7 px-2 text-xs"
                      >
                        {isCreator ? "Delete" : "Leave"}
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {challenge.exercises.length} exercises •{" "}
                    {challenge.participantCount} participants
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Status: {challenge.userStatus} • Created by:{" "}
                    {challenge.creator?.name}
                    {isCreator && (
                      <span className="text-primary ml-1">(You)</span>
                    )}
                  </div>
                </div>
              )
            })
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

      {/* Past challenges history */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Challenge History
        </h3>
        <div className="space-y-3">
          {pastChallenges && pastChallenges.length > 0 ? (
            pastChallenges.slice(0, 10).map(challenge => (
              <div
                key={challenge._id}
                className={`p-4 rounded-lg border ${
                  challenge.isCompleted
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-muted/30 border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {challenge.isCompleted ? "✅" : "📋"}
                    </span>
                    <div className="font-semibold text-foreground">
                      {challenge.name}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDateDisplay(challenge.date, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {challenge.userCompletedReps} / {challenge.userTotalTarget}{" "}
                    reps • {challenge.participantCount} participants
                  </div>
                  <div
                    className={`text-sm font-semibold ${
                      challenge.completionPercentage === 100
                        ? "text-green-600"
                        : challenge.completionPercentage >= 50
                          ? "text-yellow-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {challenge.completionPercentage}%
                  </div>
                </div>
                {/* Mini progress bar */}
                <Progress
                  value={challenge.completionPercentage}
                  className={`mt-2 h-1.5 ${
                    challenge.completionPercentage === 100
                      ? "[&>div]:bg-green-500"
                      : ""
                  }`}
                />
              </div>
            ))
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No past challenges yet. Complete some challenges to see your
                history!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmAction.isOpen}
        onOpenChange={open =>
          setConfirmAction(prev => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.action === "delete"
                ? "Delete Challenge"
                : "Leave Challenge"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.action === "delete"
                ? `Are you sure you want to delete "${confirmAction.challengeName}"? This will remove the challenge for all participants and cannot be undone.`
                : `Are you sure you want to leave "${confirmAction.challengeName}"? Your progress will be removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmAction({
                  isOpen: false,
                  challengeId: null,
                  challengeName: "",
                  action: "delete",
                  isCreator: false,
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmChallengeAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {confirmAction.action === "delete" ? "Delete" : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
