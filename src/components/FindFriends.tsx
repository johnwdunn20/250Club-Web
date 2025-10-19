"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

export default function FindFriends() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Convex queries
  const friends = useQuery(api.friendships.getFriends);
  const pendingRequests = useQuery(api.friendships.getPendingRequests);
  const sentRequests = useQuery(api.friendships.getSentRequests);
  const searchResults = useQuery(
    api.friendships.searchUsers,
    searchTerm.trim() ? { searchTerm: searchTerm.trim() } : "skip"
  );

  // Convex mutations
  const sendFriendRequest = useMutation(api.friendships.sendFriendRequest);
  const acceptFriendRequest = useMutation(api.friendships.acceptFriendRequest);
  const rejectFriendRequest = useMutation(api.friendships.rejectFriendRequest);
  const removeFriend = useMutation(api.friendships.removeFriend);

  // Debounced search
  const debouncedSearchTerm = useMemo(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setIsLoading(true);
  };

  const handleSendFriendRequest = async (friendId: Id<"users">) => {
    try {
      await sendFriendRequest({ friendId });
      toast.success("Friend request sent!");
    } catch (error) {
      console.error("Failed to send friend request:", error);
      toast.error("Failed to send friend request");
    }
  };

  const handleAcceptRequest = async (friendshipId: Id<"friendships">) => {
    try {
      await acceptFriendRequest({ friendshipId });
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Failed to accept friend request:", error);
      toast.error("Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (friendshipId: Id<"friendships">) => {
    try {
      await rejectFriendRequest({ friendshipId });
      toast.info("Friend request rejected");
    } catch (error) {
      console.error("Failed to reject friend request:", error);
      toast.error("Failed to reject friend request");
    }
  };

  const handleRemoveFriend = async (friendId: Id<"users">) => {
    try {
      await removeFriend({ friendId });
      toast.info("Friend removed");
    } catch (error) {
      console.error("Failed to remove friend:", error);
      toast.error("Failed to remove friend");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card-mobile">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Find Friends
        </h2>
        <p className="text-muted-foreground mb-6">
          Connect with friends and workout together
        </p>

        {/* Search bar */}
        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
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
                    className="p-4 bg-muted/30 rounded-lg border border-border animate-pulse"
                  >
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
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
                    <button
                      onClick={() => handleSendFriendRequest(user._id)}
                      className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Add Friend
                    </button>
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
            friends.map((friendship) => (
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
                <button
                  onClick={() => handleRemoveFriend(friendship.friendId)}
                  className="px-3 py-1 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="p-6 bg-muted/30 rounded-lg border border-border text-center">
              <div className="text-4xl mb-2">👥</div>
              <p className="text-sm text-muted-foreground">
                No friends yet. Invite your friends to join!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pending requests */}
      <div className="card-mobile">
        <h3 className="text-xl font-bold text-foreground mb-4">
          Pending Requests
          {pendingRequests && pendingRequests.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </h3>
        <div className="space-y-3">
          {pendingRequests && pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
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
                  <button
                    onClick={() => handleAcceptRequest(request._id)}
                    className="flex-1 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request._id)}
                    className="flex-1 px-3 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    Reject
                  </button>
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
            sentRequests.map((request) => (
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
                <span className="px-2 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-full">
                  Pending
                </span>
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
    </div>
  );
}
