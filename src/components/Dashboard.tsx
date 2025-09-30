"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TodaysWorkout from "./TodaysWorkout";
import NewChallenge from "./NewChallenge";
import FindFriends from "./FindFriends";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("workout");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                250 Club
              </h1>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-center mb-8">
            <TabsList className="w-full sm:w-auto grid grid-cols-3 gap-2">
              <TabsTrigger value="workout" className="flex items-center gap-2">
                <span className="text-lg sm:block hidden">💪</span>
                <span>Today</span>
              </TabsTrigger>
              <TabsTrigger value="challenge" className="flex items-center gap-2">
                <span className="text-lg sm:block hidden">🎯</span>
                <span>Challenge</span>
              </TabsTrigger>
              <TabsTrigger value="friends" className="flex items-center gap-2">
                <span className="text-lg sm:block hidden">👥</span>
                <span>Friends</span>
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
        </Tabs>
      </main>
    </div>
  );
}