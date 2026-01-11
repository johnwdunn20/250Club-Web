import type { Doc, Id } from "../../convex/_generated/dataModel"

// User type
export type User = Doc<"users">

// Friend type - friendship with populated friend user data
export type Friend = Doc<"friendships"> & {
  friend: User | null
}

// Friend request types
export type FriendRequest = Doc<"friend_requests"> & {
  requester: User | null
}

export type SentRequest = Doc<"friend_requests"> & {
  friend: User | null // Note: using 'friend' for consistency with existing code
}

// Exercise types
export type Exercise = Doc<"exercises">
export type ExerciseProgress = Doc<"exercise_progress">

// Challenge participant with user info and exercise progress
export type ChallengeParticipant = {
  userId: Id<"users">
  status: "invited" | "active" | "completed"
  user: User | null
  exerciseProgress: {
    exerciseId: Id<"exercises">
    exerciseName: string
    targetReps: number
    completedReps: number
  }[]
  totalCompleted: number
  totalTarget: number
  completionPercentage: number
}

// User challenge type - challenge with exercises, participant count, creator, and user status
export type UserChallenge = Doc<"challenges"> & {
  exercises: Exercise[]
  participantCount: number
  creator: User | null
  userStatus?: "invited" | "active" | "completed"
}

// Today's challenge item - challenge with exercises and participants progress
export type TodaysChallengeItem = Doc<"challenges"> & {
  exercises: Exercise[]
  participants: ChallengeParticipant[]
  creator: User | null
  currentUserId: Id<"users">
}

// Notification type
export type Notification = {
  _id: Id<"notifications">
  message: string
  isRead: boolean
  createdAt: number
}

// Streak data type
export type StreakData = {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

// Pending invitation type for challenge invitations
export type PendingInvitation = {
  participantId: Id<"challenge_participants">
  challengeId: Id<"challenges">
  challengeName: string
  date: string
  creatorName: string
  exerciseCount: number
  participantCount: number
}

// Array types for convenience
export type Friends = Friend[]
export type FriendRequests = FriendRequest[]
export type SentRequests = SentRequest[]
export type UserChallenges = UserChallenge[]
export type TodaysChallenges = TodaysChallengeItem[]
export type Notifications = Notification[]
