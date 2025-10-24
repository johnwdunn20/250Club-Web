"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import TodaysWorkout from "./TodaysWorkout";
import NewChallenge from "./NewChallenge";
import FindFriends from "./FindFriends";
import Notifications from "./Notifications";
import { ThemeToggle } from "./ThemeToggle";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("workout");
  const unreadCount = useQuery(api.notifications.getUnreadCount);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                  250 Club
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="w-full sm:w-auto grid grid-cols-4 gap-2">
              <TabsTrigger value="workout" className="flex items-center gap-2">
                <span className="text-lg">💪</span>
                <span className="hidden sm:inline">Today</span>
              </TabsTrigger>
              <TabsTrigger value="challenge" className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="hidden sm:inline">Challenge</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <span className="text-lg">👥</span>
                <span className="hidden sm:inline">Friends</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <div className="relative">
                  <span className="text-lg">🔔</span>
                  {unreadCount !== undefined && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </div>
                <span className="hidden sm:inline">Notifications</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="workout">
            <TodaysWorkout />
          </TabsContent>

          <TabsContent value="challenge">
            <NewChallenge />
          </TabsContent>

          <TabsContent value="friends">
            <FindFriends />
          </TabsContent>

          <TabsContent value="notifications">
            <Notifications />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}