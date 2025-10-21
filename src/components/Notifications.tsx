"use client";

import { Card } from "@/components/ui/card";

export default function Notifications() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🔔</span>
          <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
          <p className="text-muted-foreground">
            You&apos;ll see friend requests, challenge invites, and updates here
          </p>
        </div>
      </Card>
    </div>
  );
}
