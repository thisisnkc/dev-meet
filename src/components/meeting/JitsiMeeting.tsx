import { useCallback, useEffect, useRef, useState } from "react";
import { PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthUser } from "@/lib/auth";
import { useRouter } from "next/router";
import { LeaveConfirmationDialog } from "./LeaveConfirmationDialog";
import { MeetingEvent } from "@/utlis/constants";

interface JitsiMeetingProps {
  roomName: string;
  token?: string | null;
  user?: AuthUser;
  isGuest?: boolean;
  guestEmail?: string;
  notifyHostEvent?: (event: MeetingEvent) => void;
}

interface JitsiMeetExternalAPI {
  executeCommand?(command: string, ...args: unknown[]): void;
  dispose?(): void;
  on?(event: string, callback: (data: unknown) => void): void;
}

export const JitsiMeeting = ({
  roomName,
  token,
  user,
  guestEmail,
  isGuest,
  notifyHostEvent,
}: JitsiMeetingProps) => {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState("");
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const jitsiContainer = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<JitsiMeetExternalAPI | null>(null);
  const disconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, []);
  // ... (lines skipped)

  const handleDisconnect = useCallback(async () => {
    if (!isGuest) {
      await notifyHostEvent?.(MeetingEvent.HOST_LEFT);
      window.close();
      //    Fallback if window.close() is blocked
      disconnectTimeoutRef.current = setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } else {
      router.push("/meeting/ended");
    }
  }, [router, isGuest, notifyHostEvent]);

  const confirmLeave = () => {
    setShowLeaveDialog(false);
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand?.("hangup");
    } else {
      handleDisconnect();
    }
  };

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
      const username = user
        ? user.email
        : guestEmail || `Guest-${Math.floor(1000 + Math.random() * 9000)}`;

      const options = {
        roomName: roomName as string,
        width: "100%",
        height: "100%",
        // Use token if available (Host/Mod), otherwise null (Guest)
        jwt: token || null,
        parentNode: document.getElementById("jitsi-container"),
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          // Intercept hangup button click
          buttonsWithNotifyClick: [{ key: "hangup", preventExecution: true }],
          toolbarButtons: [
            "microphone",
            "camera",
            "closedcaptions",
            "desktop",
            "fullscreen",
            "fodeviceselection",
            "hangup", // Native hangup enabled
            "profile",
            "chat",
            "recording",
            "livestreaming",
            "etherpad",
            "sharedvideo",
            "settings",
            "raisehand",
            "videoquality",
            "filmstrip",
            "invite",
            "feedback",
            "stats",
            "shortcuts",
            "tileview",
            "videobackgroundblur",
            "download",
            "help",
            "mute-everyone",
            "security",
          ],
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

      const jitsiInstance = new window.JitsiMeetExternalAPI(
        domain,
        options
      ) as JitsiMeetExternalAPI;
      jitsiApiRef.current = jitsiInstance;
      setIsConnecting(false);

      // Add event listeners with optional chaining
      jitsiInstance.on?.("participantJoined", () => {});

      jitsiInstance.on?.("participantLeft", () => {});

      jitsiInstance.on?.("videoConferenceJoined", () => {
        setIsConnecting(false);
      });

      // Handle custom toolbar button clicks
      jitsiInstance.on?.("toolbarButtonClicked", (data: unknown) => {
        const payload = data as { key: string };
        if (payload?.key === "hangup") {
          setShowLeaveDialog(true);
        }
      });

      // Still listen to readyToClose as a fallback or for other triggers
      // jitsiInstance.on?.("videoConferenceLeft", () => {
      //   handleDisconnect();
      // });

      // jitsiInstance.on?.("readyToClose", () => {
      //   handleDisconnect();
      // });

      // Cleanup function
      return () => {
        if (jitsiInstance) {
          jitsiInstance.dispose?.();
        }
      };
    } catch (err) {
      console.error("Failed to initialize Jitsi", err);
      setError("Failed to initialize the meeting. Please try again.");
      setIsConnecting(false);
    }
  }, [roomName, token, user, guestEmail]);

  // Initialize Jitsi when script is loaded
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

      <LeaveConfirmationDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        onConfirm={confirmLeave}
        title={isGuest ? "Leave Meeting?" : "End Meeting for Everyone?"}
        description={
          isGuest
            ? "Are you sure you want to leave? You can rejoin later if the meeting is still active."
            : "As the host, leaving will end the meeting for all participants. Are you sure?"
        }
      />

      {/* Always render the meeting interface so jitsiContainer ref is available */}
      <div className="relative w-full h-screen bg-black overflow-hidden group">
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
