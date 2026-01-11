"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { toast } from "sonner"
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Friends, FriendRequests, SentRequests } from "@/types/convex"

interface FindFriendsProps {
  friends: Friends | undefined
  pendingRequests: FriendRequests | undefined
  sentRequests: SentRequests | undefined
}

export default function FindFriends({
  friends,
  pendingRequests,
  sentRequests,
}: FindFriendsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<{
    isOpen: boolean
    friendId: Id<"users"> | null
    friendName: string
  }>({
    isOpen: false,
    friendId: null,
    friendName: "",
  })

  // Dynamic query for search results (kept in component since it's user-driven)
  const searchResults = useQuery(
    api.friendships.searchUsers,
    searchTerm.trim() ? { searchTerm: searchTerm.trim() } : "skip"
  )

  // Convex mutations
  const sendFriendRequest = useMutation(api.friendships.sendFriendRequest)
  const acceptFriendRequest = useMutation(api.friendships.acceptFriendRequest)
  const rejectFriendRequest = useMutation(api.friendships.rejectFriendRequest)
  const removeFriend = useMutation(api.friendships.removeFriend)
  const cancelFriendRequest = useMutation(api.friendships.cancelFriendRequest)

  // Clear loading state after search
  useEffect(() => {
    if (searchTerm) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [searchTerm])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setIsLoading(true)
  }

  const handleSendFriendRequest = async (friendId: Id<"users">) => {
    try {
      await sendFriendRequest({ friendId })
      toast.success("Friend request sent!")
    } catch (error) {
      console.error("Failed to send friend request:", error)
      toast.error("Failed to send friend request")
    }
  }

  const handleAcceptRequest = async (requestId: Id<"friend_requests">) => {
    try {
      await acceptFriendRequest({ friendshipId: requestId })
      toast.success("Friend request accepted!")
    } catch (error) {
      console.error("Failed to accept friend request:", error)
      toast.error("Failed to accept friend request")
    }
  }

  const handleRejectRequest = async (requestId: Id<"friend_requests">) => {
    try {
      await rejectFriendRequest({ friendshipId: requestId })
      toast.info("Friend request rejected")
    } catch (error) {
      console.error("Failed to reject friend request:", error)
      toast.error("Failed to reject friend request")
    }
  }

  const handleRemoveFriend = (friendId: Id<"users">, friendName: string) => {
    setConfirmRemove({
      isOpen: true,
      friendId,
      friendName,
    })
  }

  const confirmRemoveFriend = async () => {
    if (!confirmRemove.friendId) return

    try {
      await removeFriend({ friendId: confirmRemove.friendId })
      toast.info("Friend removed")
    } catch (error) {
      console.error("Failed to remove friend:", error)
      toast.error("Failed to remove friend")
    } finally {
      setConfirmRemove({ isOpen: false, friendId: null, friendName: "" })
    }
  }

  const handleCancelRequest = async (requestId: Id<"friend_requests">) => {
    try {
      await cancelFriendRequest({ requestId })
      toast.info("Friend request cancelled")
    } catch (error) {
      console.error("Failed to cancel friend request:", error)
      toast.error("Failed to cancel friend request")
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-mobile">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Find Friends
        </h2>
        <p className="text-muted-foreground mb-6">
          Connect with friends and workout together
        </p>

        {/* Search bar */}
        <div className="relative mb-6">
          <Input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={e => handleSearch(e.target.value)}
            className="pl-10 h-11"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Search results */}
        {searchTerm && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">
              Search Results
            </h3>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-muted/30 rounded-lg border border-border"
                  >
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map(user => (
                  <div
                    key={user._id}
                    className="p-4 bg-muted/30 rounded-lg border border-border flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSendFriendRequest(user._id)}
                    >
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                <p className="text-sm text-muted-foreground">No users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Friends list */}
      <div className="card-mobile">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-foreground">Your Friends</h3>
          <span className="text-sm text-muted-foreground">
            {friends ? `${friends.length} friends` : "Loading..."}
          </span>
        </div>

        <div className="space-y-3">
          {friends && friends.length > 0 ? (
            friends.map(friendship => (
              <div
                key={friendship._id}
                className="p-4 bg-muted/30 rounded-lg border border-border flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {friendship.friend?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {friendship.friend?.email}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    handleRemoveFriend(
                      friendship.friendId,
                      friendship.friend?.name || "this friend"
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="p-6 bg-muted/30 rounded-lg border border-border">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">👥</div>
                <h4 className="font-semibold text-foreground mb-2">
                  No friends yet
                </h4>
                <p className="text-sm text-muted-foreground">
                  Add friends to get the most out of 250 Club!
                </p>
              </div>

              {/* Why friends matter */}
              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-base">🏆</span>
                  <span>
                    Challenge friends to daily workouts and compete together
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-base">👀</span>
                  <span>
                    See when friends complete challenges for motivation
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-base">📊</span>
                  <span>Track progress on a shared leaderboard</span>
                </div>
              </div>

              {/* Invite link */}
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-2">
                  Invite friends to join 250 Club
                </p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    readOnly
                    value="https://250club.johnwdunn.com/"
                    className="flex-1 text-sm text-muted-foreground"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        "https://250club.johnwdunn.com/"
                      )
                      toast.success("Link copied to clipboard!")
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending requests */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Pending Requests
          {pendingRequests && pendingRequests.length > 0 && (
            <Badge className="ml-2">{pendingRequests.length}</Badge>
          )}
        </h3>
        <div className="space-y-3">
          {pendingRequests && pendingRequests.length > 0 ? (
            pendingRequests.map(request => (
              <div
                key={request._id}
                className="p-4 bg-muted/30 rounded-lg border border-border"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">
                      {request.requester?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {request.requester?.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAcceptRequest(request._id)}
                  >
                    Accept
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRejectRequest(request._id)}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No pending friend requests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sent requests */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Sent Requests
        </h3>
        <div className="space-y-3">
          {sentRequests && sentRequests.length > 0 ? (
            sentRequests.map(request => (
              <div
                key={request._id}
                className="p-4 bg-muted/30 rounded-lg border border-border flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {request.friend?.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {request.friend?.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCancelRequest(request._id)}
                >
                  Cancel
                </Button>
              </div>
            ))
          ) : (
            <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
              <p className="text-sm text-muted-foreground">
                No sent friend requests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmRemove.isOpen}
        onOpenChange={open =>
          setConfirmRemove(prev => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {confirmRemove.friendName} from
              your friends list? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmRemove({
                  isOpen: false,
                  friendId: null,
                  friendName: "",
                })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveFriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
