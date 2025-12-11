"use client";

import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GetServerSidePropsContext } from "next";
import { Button } from "@/components/ui/button";
import jwt from "jsonwebtoken";
import { PhoneOff } from "lucide-react";
import { genJitsiTokenPayload } from "@/utlis/constants";
import { requireAuth, AuthUser } from "@/lib/auth";
// Type declarations for Jitsi Meet API
declare namespace JitsiMeetJS {
  interface JitsiMeetExternalAPI {
    dispose: () => void;
    executeCommand: (command: string, ...args: unknown[]) => void;
    getParticipantsInfo: () => Array<{ displayName: string }>;
    on: (event: string, callback: JitsiEventCallback) => void;
    off: (event: string, callback: JitsiEventCallback) => void;
    addListener: (event: string, callback: JitsiEventCallback) => void;
    removeListener: (event: string, callback: JitsiEventCallback) => void;
  }
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any; // Using any to avoid type conflicts with Jitsi's global declaration
  }
}

type JitsiEventCallback = (...args: unknown[]) => void;

const MeetingPage = (props: { token: string; user?: AuthUser }) => {
  const router = useRouter();
  const { id: roomName } = router.query;

  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const jitsiContainer = useRef<HTMLDivElement>(null);

  const handleDisconnect = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  const initializeJitsi = useCallback(() => {
    if (!jitsiContainer.current || !roomName) {
      return;
    }

    try {
      if (!window.JitsiMeetExternalAPI) {
        throw new Error("Jitsi Meet API not loaded");
      }

      setIsConnecting(true);

      const domain = process.env.NEXT_PUBLIC_MEET_DOMAIN || "meet.jit.si";
      const username = `User-${Math.floor(1000 + Math.random() * 9000)}`;

      const options = {
        roomName: roomName as string,
        width: "100%",
        height: "100%",
        jwt: props.token,
        parentNode: document.getElementById("jitsi-container"),
        configOverwrite: {
          prejoinPageEnabled: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          DEFAULT_REMOTE_DISPLAY_NAME: "Participant",
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        },
        userInfo: {
          displayName: username,
        },
      };

      const jitsiInstance = new window.JitsiMeetExternalAPI(domain, options);
      setIsConnecting(false);

      // Add event listeners
      jitsiInstance.on("participantJoined", () => {});

      jitsiInstance.on("participantLeft", () => {});

      jitsiInstance.on("videoConferenceJoined", () => {
        setIsConnecting(false);
      });

      jitsiInstance.on("readyToClose", () => {
        handleDisconnect();
      });

      // Cleanup function
      return () => {
        if (jitsiInstance) {
          jitsiInstance.dispose();
        }
      };
    } catch (err) {
      console.error("Failed to initialize Jitsi", err);
      setError("Failed to initialize the meeting. Please try again.");
      setIsConnecting(false);
    }
  }, [roomName, handleDisconnect]);

  // Initialize Jitsi when script is loaded and container is ready
  useEffect(() => {
    if (isScriptLoaded && jitsiContainer.current && roomName) {
      initializeJitsi();
    }
  }, [isScriptLoaded, roomName, initializeJitsi]);

  // Load Jitsi script manually
  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_MEET_DOMAIN || "meet.jit.si";
    const scriptId = "jitsi-api-script";

    // Check if script is already loaded
    if (window.JitsiMeetExternalAPI) {
      console.log("Jitsi script already loaded");
      setIsScriptLoaded(true);
      return;
    }

    // Check if script tag already exists
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://${domain}/external_api.js`;
    script.async = true;

    script.onload = () => {
      console.log("Jitsi script loaded");
      setIsScriptLoaded(true);
    };

    script.onerror = (e) => {
      console.error("Failed to load Jitsi script", e);
      setError("Failed to load video chat. Please refresh the page.");
      setIsConnecting(false);
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup: remove script on unmount
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const renderLoading = () => (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-md mx-auto">
        <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Joining Meeting
        </h1>
        <p className="text-gray-600">Setting up your meeting experience...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <PhoneOff className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Meeting Error</h1>
        <p className="text-gray-600 mb-6">
          {error ||
            "Unable to join the meeting. Please check the URL and try again."}
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-base font-medium"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );

  if (error) {
    return renderError();
  }

  return (
    <>
      {/* Show loader overlay while connecting */}
      {isConnecting && renderLoading()}

      {/* Always render the meeting interface so jitsiContainer ref is available */}
      <div className="relative w-full h-screen bg-black">
        <div
          ref={jitsiContainer}
          className="w-full h-full"
          id="jitsi-container"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            border: 0,
          }}
        />
      </div>
    </>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  // Check authentication
  const authResult = requireAuth(context);

  // If not authenticated, redirect to login
  if (authResult.redirect) {
    return { redirect: authResult.redirect };
  }

  // Generate Jitsi JWT token for the meeting
  const jitsiToken = jwt.sign(
    genJitsiTokenPayload(authResult.user?.email, authResult.user?.email),
    process.env.MEET_SECRET || "default_secret",
    {
      algorithm: "HS256",
    }
  );

  return {
    props: {
      token: jitsiToken,
      user: authResult.user,
    },
  };
};

export default MeetingPage;
