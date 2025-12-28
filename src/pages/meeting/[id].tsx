"use client";

import { useState } from "react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { genJitsiTokenPayload } from "@/utlis/constants";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { GuestPinScreen } from "@/components/meeting/GuestPinScreen";
import { JitsiMeeting } from "@/components/meeting/JitsiMeeting";

const MeetingPage = (props: {
  token?: string;
  user?: AuthUser;
  isGuest?: boolean;
  meetingId?: string;
}) => {
  const router = useRouter();
  const { id: roomName } = router.query;
  const [isPinVerified, setIsPinVerified] = useState(false);

  // If Verified guest OR Authenticated host -> Show Meeting
  const showMeeting = !!(props.token || (props.isGuest && isPinVerified));

  if (!roomName) return null;

  return (
    <>
      {/* GUESTS: Show PIN Screen if not verified */}
      {props.isGuest && !isPinVerified && (
        <GuestPinScreen
          meetingId={props.meetingId || (roomName as string)}
          onSuccess={() => setIsPinVerified(true)}
        />
      )}

      {/* MEETING: Show Jitsi if allowed */}
      {showMeeting && (
        <JitsiMeeting
          roomName={roomName as string}
          token={props.token}
          user={props.user}
          isGuest={props.isGuest}
        />
      )}
    </>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const user = getAuthUser(context.req);
  const meetingId = context.params?.id as string;

  if (!user) {
    return {
      props: {
        isGuest: true,
        meetingId: meetingId || "",
      },
    };
  }

  const jitsiToken = jwt.sign(
    genJitsiTokenPayload(user.email, user.email),
    process.env.MEET_SECRET || "default_secret",
    {
      algorithm: "HS256",
    }
  );

  return {
    props: {
      token: jitsiToken,
      user: user,
      meetingId: meetingId || "",
    },
  };
};

export default MeetingPage;
