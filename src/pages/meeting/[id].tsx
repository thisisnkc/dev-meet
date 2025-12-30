"use client";

import { useState, useEffect, useCallback } from "react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import jwt from "jsonwebtoken";
import { genJitsiTokenPayload } from "@/utlis/constants";
import { getAuthUser, AuthUser } from "@/lib/auth";
import { GuestPinScreen } from "@/components/meeting/GuestPinScreen";
import { JitsiMeeting } from "@/components/meeting/JitsiMeeting";
import { usePusherContext } from "@/context/PusherContext";
import { MeetingEvent } from "@/utlis/constants";

const MeetingPage = (props: {
  token?: string;
  user?: AuthUser;
  isGuest?: boolean;
  meetingId?: string;
}) => {
  const router = useRouter();
  const { id: roomName } = router.query;
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const { pusherClient } = usePusherContext();

  // Notify server that host has joined/left
  // Notify server that host has joined/left
  const notifyHostEvent = useCallback(
    async (event: MeetingEvent) => {
      if (!props.token || props.isGuest || !props.meetingId) return;

      try {
        await fetch("/api/meeting/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ meetingId: props.meetingId, event }),
          keepalive: true,
        });
      } catch (error) {
        console.error(`Failed to notify ${event}:`, error);
      }
    },
    [props.token, props.isGuest, props.meetingId]
  );

  useEffect(() => {
    // If we have a token (Host) and meeting ID, notify server
    if (props.token && !props.isGuest && props.meetingId) {
      notifyHostEvent(MeetingEvent.HOST_JOINED);
    }
  }, [notifyHostEvent, props.token, props.isGuest, props.meetingId]);

  // Listen for host-left event to redirect everyone
  useEffect(() => {
    if (props.meetingId) {
      console.log("Pusher Client State:", pusherClient.connection.state);
      const channel = pusherClient.subscribe(`meeting-${props.meetingId}`);
      console.log("Subscribed to channel:", `meeting-${props.meetingId}`);

      channel.bind("pusher:subscription_succeeded", () => {
        console.log("Successfully subscribed to channel!");
      });

      channel.bind("pusher:subscription_error", (status: unknown) => {
        console.error("Subscription error:", status);
      });

      channel.bind(MeetingEvent.HOST_LEFT, (data: unknown) => {
        console.log("EVENT RECEIVED: HOST_LEFT", data);
        console.log("Current User is Guest:", props.isGuest);
        if (props.isGuest) {
          router.push("/meeting/ended");
        }
      });

      return () => {
        pusherClient.unsubscribe(`meeting-${props.meetingId}`);
      };
    }
  }, [props.meetingId, router, props.isGuest, pusherClient]);

  // If Verified guest OR Authenticated host -> Show Meeting
  const showMeeting = !!(props.token || (props.isGuest && isPinVerified));

  if (!roomName) return null;

  return (
    <>
      {/* GUESTS: Show PIN Screen if not verified */}
      {props.isGuest && !isPinVerified && (
        <GuestPinScreen
          meetingId={props.meetingId || (roomName as string)}
          onSuccess={(email) => {
            if (email) setGuestEmail(email);
            setIsPinVerified(true);
          }}
        />
      )}

      {/* MEETING: Show Jitsi if allowed */}
      {showMeeting && (
        <JitsiMeeting
          roomName={roomName as string}
          token={props.token}
          user={props.user}
          isGuest={props.isGuest}
          guestEmail={guestEmail}
          notifyHostEvent={notifyHostEvent}
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
