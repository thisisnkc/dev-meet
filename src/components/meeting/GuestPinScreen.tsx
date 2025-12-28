import { useState, useRef, useEffect } from "react";
import { Lock, ArrowRight, Loader2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GuestPinScreenProps {
  meetingId: string;
  onSuccess: () => void;
}

export const GuestPinScreen = ({
  meetingId,
  onSuccess,
}: GuestPinScreenProps) => {
  const [pin, setPin] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;

    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/meeting/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId, pin }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid PIN");
      }

      onSuccess();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to verify PIN");
      }
    } finally {
      setVerifying(false);
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

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
                      if (val.length <= 6) setPin(val);
                    }}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                    autoComplete="one-time-code"
                    disabled={verifying}
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
                          isActive && !verifying
                            ? "border-indigo-500 ring-2 ring-indigo-500/20 z-10 bg-white"
                            : "border-slate-200",
                          isFilled &&
                            "border-indigo-200 bg-indigo-50/30 text-indigo-700",
                          error && "border-red-300 bg-red-50/30 text-red-600"
                        )}
                      >
                        {pin[i] || ""}
                        {isActive && !verifying && !pin[i] && (
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
                disabled={verifying || pin.length < 6}
              >
                {verifying ? (
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
