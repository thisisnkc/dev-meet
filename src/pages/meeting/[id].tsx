"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// Dynamic import for client-only rendering
const JitsiMeeting = dynamic(() => import("@/components/MeetingPage"), {
  ssr: false,
});

export default function MeetingPage() {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== "string") {
    return <p className="p-4 text-center">Invalid meeting ID</p>;
  }

  return (
    <div className="h-screen w-full">
      <JitsiMeeting roomName={id} userName="Guest User" />
    </div>
  );
}
