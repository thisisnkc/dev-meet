import { useState, useRef, useEffect } from "react";
import {
  Lock,
  ArrowRight,
  Loader2,
  Video,
  Clock,
  CalendarX,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePusherContext } from "@/context/PusherContext";
import { format, formatDistanceToNow } from "date-fns";
import { MeetingStatus, MeetingEvent } from "@/utlis/constants";

interface GuestPinScreenProps {
  meetingId: string;
  onSuccess: (email?: string) => void;
}

export const GuestPinScreen = ({
  meetingId,
  onSuccess,
}: GuestPinScreenProps) => {
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<MeetingStatus>(MeetingStatus.IDLE);
  const [error, setError] = useState("");
  const [meetingDetails, setMeetingDetails] = useState<{
    startTime: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { pusherClient } = usePusherContext();

  useEffect(() => {
    if (status === MeetingStatus.IDLE) {
      inputRef.current?.focus();
    }
  }, [status]);

  useEffect(() => {
    if (status === MeetingStatus.WAITING_FOR_HOST) {
      const channel = pusherClient.subscribe(`meeting-${meetingId}`);

      channel.bind(MeetingEvent.HOST_JOINED, () => {
        onSuccess();
      });

      return () => {
        pusherClient.unsubscribe(`meeting-${meetingId}`);
      };
    }
  }, [status, meetingId, onSuccess, pusherClient]);

  // We need to use a reference to the latest pin value for the timeout handler
  const pinRef = useRef(pin);
  useEffect(() => {
    pinRef.current = pin;
  }, [pin]);

  const handlePinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    // Use ref to get latest pin value ensuring closure doesn't have stale state
    const currentPin = pinRef.current;
    if (currentPin.length !== 6) return;

    setStatus(MeetingStatus.VERIFYING);
    setError("");

    try {
      const res = await fetch("/api/meeting/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, pin: currentPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle explicit error statuses
        if (data.status === MeetingStatus.TOO_EARLY) {
          setStatus(MeetingStatus.TOO_EARLY);
          setMeetingDetails({ startTime: data.startTime });
        } else if (data.status === MeetingStatus.TOO_LATE) {
          setStatus(MeetingStatus.TOO_LATE);
        } else {
          throw new Error(data.message || "Invalid PIN");
        }
        return;
      }

      // Handle success statuses
      if (data.status === MeetingStatus.WAITING_FOR_HOST) {
        setStatus(MeetingStatus.WAITING_FOR_HOST);
        if (data.startTime) setMeetingDetails({ startTime: data.startTime });
      } else if (data.status === MeetingStatus.VALID || data.valid) {
        onSuccess(data.email);
      }
    } catch (err) {
      setStatus(MeetingStatus.IDLE);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to verify PIN");
      }
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  if (status === MeetingStatus.WAITING_FOR_HOST) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <div className="absolute top-0 right-1/2 translate-x-10 -translate-y-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-bounce" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Waiting for Host
            </h2>
            <p className="text-slate-500">
              The host hasn&apos;t joined yet. We&apos;ll automatically let you
              in once they arrive.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-sm font-medium text-slate-700">
              Scheduled Start
            </p>
            <p className="text-lg text-indigo-600 font-semibold">
              {meetingDetails?.startTime
                ? format(new Date(meetingDetails.startTime), "h:mm a")
                : "--:--"}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => setStatus(MeetingStatus.IDLE)}
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (status === MeetingStatus.TOO_EARLY) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-10 h-10 text-indigo-600" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              You&apos;re Early!
            </h2>
            <p className="text-slate-500">
              The meeting is scheduled to start in{" "}
              <strong>
                {meetingDetails?.startTime
                  ? formatDistanceToNow(new Date(meetingDetails.startTime))
                  : "later"}
              </strong>
              .
            </p>
            <p className="text-sm text-slate-400 mt-2">
              You can join 30 minutes before the start time.
            </p>
          </div>

          <Button
            onClick={() => setStatus(MeetingStatus.IDLE)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (status === MeetingStatus.TOO_LATE) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <CalendarX className="w-10 h-10 text-slate-500" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              Meeting Ended
            </h2>
            <p className="text-slate-500">
              This meeting has already finished. Please contact the organizer if
              you believe this is a mistake.
            </p>
          </div>

          <Button
            onClick={() => setStatus(MeetingStatus.IDLE)}
            variant="outline"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand/Logo Area */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-2xl">
            <Video className="w-8 h-8" />
            <span>DevMeet</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 translate-y-10" />

            <div className="relative z-10">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Join Meeting
              </h1>
              <p className="text-indigo-100 text-sm">
                Enter the secure PIN provided in your invitation
              </p>
            </div>
          </div>

          <div className="p-8">
            <form onSubmit={handlePinSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium ml-1">
                  Meeting PIN
                </Label>

                {/* OTP Input Container */}
                <div
                  className="relative flex justify-center gap-2 sm:gap-3 cursor-text"
                  onClick={handleContainerClick}
                >
                  {/* Hidden Input */}
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) {
                        setPin(val);
                        if (val.length === 6) {
                          // Use setTimeout to allow state update to propagate
                          setTimeout(() => {
                            handlePinSubmit();
                          }, 0);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                    autoComplete="one-time-code"
                    disabled={status === MeetingStatus.VERIFYING}
                  />

                  {/* Visual Boxes */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const isActive = i === pin.length;
                    const isFilled = i < pin.length;

                    return (
                      <div
                        key={i}
                        className={cn(
                          "w-10 h-14 sm:w-12 sm:h-16 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 bg-slate-50",
                          isActive && status !== MeetingStatus.VERIFYING
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 z-10 bg-white"
                            : "border-slate-200",
                          isFilled &&
                            "border-indigo-200 bg-indigo-50/30 text-indigo-700",
                          error && "border-red-300 bg-red-50/30 text-red-600"
                        )}
                      >
                        {pin[i] || ""}
                        {isActive &&
                          status !== MeetingStatus.VERIFYING &&
                          !pin[i] && (
                            <div className="w-0.5 h-6 bg-indigo-500 animate-pulse rounded-full" />
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm p-3 rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 rounded-xl"
                disabled={status === MeetingStatus.VERIFYING || pin.length < 6}
              >
                {status === MeetingStatus.VERIFYING ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Join Meeting
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href={`/login?redirect=/meeting/${meetingId}`}
                className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Login as Host
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Protected by DevMeet Secure Access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
