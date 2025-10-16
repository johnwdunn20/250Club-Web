"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import SplashPage from "@/components/SplashPage";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <>
      <Authenticated>
        <Dashboard />
      </Authenticated>
      <Unauthenticated>
        <SplashPage />
      </Unauthenticated>
    </>
  );
}
