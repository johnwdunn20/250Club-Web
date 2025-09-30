"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import SplashPage from "@/components/SplashPage";

export default function Home() {
  return (
    <>
      <Authenticated>
        <UserButton />
        {/* <Content /> */}
        <div>Authenticated content</div>
      </Authenticated>
      <Unauthenticated>
        <SplashPage />
      </Unauthenticated>
    </>
  );
}

function Content() {
  const messages = useQuery(api.messages.getForCurrentUser);
  return <div>Authenticated content: {messages?.length}</div>;
}
