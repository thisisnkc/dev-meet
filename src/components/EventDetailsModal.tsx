import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Calendar as CalendarIcon,
  Users,
  FileText,
  Trash2,
  Video,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { joinMeeting } from "@/utlis/constants";
import { useState } from "react";
import { toast } from "sonner";

interface EventDetailsModalProps {
  meeting: {
    id: string;
    title: string;
    date: string;
    from: string;
    meetingId: string;
    to: string;
    description?: string;
    attendees: { id: string; email: string }[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

export default function EventDetailsModal({
  meeting,
  open,
  onOpenChange,
  onDelete,
}: EventDetailsModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  if (!meeting) return null;
  const isPast =
    new Date(`${meeting.date.split("T")[0]}T${meeting.to}`) < new Date();

  const performDelete = async () => {
    setDeleting(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("User not found");
      const user = JSON.parse(userStr);

      const res = await fetch(`/api/bookings/${meeting.id}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast.success("Meeting canceled successfully");
      onDelete(meeting.id);
      onOpenChange(false);
      setIsConfirming(false);
    } catch {
      toast.error("Failed to cancel meeting");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setIsConfirming(false); // Reset on close
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md bg-white rounded-xl shadow-2xl border border-slate-200">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <DialogTitle className="text-2xl font-bold text-slate-800 flex items-start justify-between gap-2">
            <span className="break-words">{meeting.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">Date & Time</div>
              <div className="text-slate-600">
                {format(new Date(meeting.date), "EEEE, MMMM d, yyyy")}
              </div>
              <div className="text-slate-500 text-sm flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {meeting.from} - {meeting.to}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Video className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-900">Meeting Link</div>
              <Button
                onClick={() => joinMeeting(meeting.meetingId)}
                disabled={isPast}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-blue-300 disabled:text-black disabled:cursor-not-allowed"
              >
                {isPast ? "Meeting Ended" : "Join Meeting"}
                {!isPast && <ExternalLink className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>

          {meeting.description && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">Description</div>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  {meeting.description}
                </p>
              </div>
            </div>
          )}

          {meeting.attendees.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-900 mb-2">
                  Attendees ({meeting.attendees.length})
                </div>
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.map((a) => (
                    <div
                      key={a.id}
                      className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 border border-slate-200"
                    >
                      {a.email}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            {isPast ? (
              <p className="text-sm text-slate-500 italic">
                Past meetings cannot be canceled
              </p>
            ) : !isConfirming ? (
              <Button
                variant="destructive"
                onClick={() => setIsConfirming(true)}
                disabled={deleting}
                className="bg-red-50 text-red-600 hover:bg-red-100 border-none shadow-none hover:text-red-700 w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Cancel Meeting
              </Button>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto bg-red-50 p-2 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                <span className="text-sm font-medium text-red-800">
                  Are you sure?
                </span>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsConfirming(false)}
                    disabled={deleting}
                    className="text-red-600 hover:text-red-700 hover:bg-red-100/50"
                  >
                    No, keep it
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={performDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? "Canceling..." : "Yes, cancel it"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
