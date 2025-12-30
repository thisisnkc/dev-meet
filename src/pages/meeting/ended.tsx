import { Video, CalendarX } from "lucide-react";

export default function MeetingEnded() {
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
                <CalendarX className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Meeting Ended
              </h1>
              <p className="text-indigo-100 text-sm">
                Thank you for joining. Have a great day!
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-slate-600">
                The host has ended this meeting for everyone. You can close this
                tab.
              </p>
            </div>

            {/* <Button
              onClick={() => router.push("/")}
              className="w-full h-12 text-base bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-200 rounded-xl"
            >
              Back to Home
            </Button> */}
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
}
