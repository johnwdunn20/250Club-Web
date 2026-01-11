"use client"

import { useState } from "react"
import { Id } from "../../convex/_generated/dataModel"
import type { PendingInvitation } from "@/types/convex"
import { Button } from "./ui/button"

interface PendingInvitationsCardProps {
  pendingInvitations: PendingInvitation[] | undefined
  onAccept: (participantId: Id<"challenge_participants">) => Promise<void>
  onDecline: (participantId: Id<"challenge_participants">) => Promise<void>
}

export default function PendingInvitationsCard({
  pendingInvitations,
  onAccept,
  onDecline,
}: PendingInvitationsCardProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (!pendingInvitations || pendingInvitations.length === 0) return null

  const handleAccept = async (participantId: Id<"challenge_participants">) => {
    setLoadingId(`accept-${participantId}`)
    try {
      await onAccept(participantId)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDecline = async (participantId: Id<"challenge_participants">) => {
    setLoadingId(`decline-${participantId}`)
    try {
      await onDecline(participantId)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="card-mobile border-2 border-primary/30 bg-primary/5">
      <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        <span className="text-2xl">📨</span>
        Challenge Invitations
        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
          {pendingInvitations.length}
        </span>
      </h3>
      <div className="space-y-3">
        {pendingInvitations.map(invitation => (
          <div
            key={invitation.participantId}
            className="p-4 bg-background rounded-lg border border-border"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-foreground">
                  {invitation.challengeName}
                </div>
                <div className="text-sm text-muted-foreground">
                  From {invitation.creatorName} •{" "}
                  {new Date(invitation.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {invitation.exerciseCount} exercises •{" "}
                  {invitation.participantCount} participants
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleAccept(invitation.participantId)}
                className="flex-1"
                size="sm"
                disabled={loadingId !== null}
              >
                {loadingId === `accept-${invitation.participantId}`
                  ? "Accepting..."
                  : "Accept"}
              </Button>
              <Button
                onClick={() => handleDecline(invitation.participantId)}
                variant="destructive"
                className="flex-1"
                size="sm"
                disabled={loadingId !== null}
              >
                {loadingId === `decline-${invitation.participantId}`
                  ? "Declining..."
                  : "Decline"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
