"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import SplashPage from "@/components/SplashPage";
import Dashboard from "@/components/Dashboard";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
export default function Home() {
  const { isLoading, isAuthenticated } = useStoreUserEffect();
  return (
    <>
      {isLoading ? (
        <DashboardSkeleton />
      ) : isAuthenticated ? (
        <>
          <Authenticated>
            <Dashboard />
          </Authenticated>
        </>
      ) : (
        <Unauthenticated>
          <SplashPage />
        </Unauthenticated>
      )}
    </>
  );
}
