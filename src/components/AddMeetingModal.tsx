import { useRef, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2Icon } from "lucide-react";

interface AddMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMeeting: (data: {
    title: string;
    date: string;
    from: string;
    to: string;
    description?: string;
    attendees: string[];
  }) => Promise<void> | void;
}

export default function AddMeetingModal({
  open,
  onOpenChange,
  onCreateMeeting,
}: AddMeetingModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    date: new Date(),
    from: "",
    to: "",
    description: "",
    attendees: [] as string[],
  });

  // State for chip input
  const [emails, setEmails] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const emailInputRef = useRef<HTMLInputElement>(null);

  // Email validation helper
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Remove email chip
  function removeEmail(idx: number) {
    setEmails((prev) => {
      const newEmails = [...prev];
      newEmails.splice(idx, 1);
      setFormData((f) => ({ ...f, attendees: newEmails }));
      return newEmails;
    });
  }

  // Add email chip
  function addEmailChip(raw: string) {
    const email = raw.trim();
    if (!email) return;
    if (!isValidEmail(email)) return;
    if (emails.includes(email)) return;
    const newEmails = [...emails, email];
    setEmails(newEmails);
    setFormData((f) => ({ ...f, attendees: newEmails }));
    setAttendeeInput("");
  }

  // Handle input change
  function handleAttendeeInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAttendeeInput(e.target.value);
  }

  // Handle input key down
  function handleAttendeeInputKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (["Enter", ",", "Tab"].includes(e.key)) {
      e.preventDefault();
      addEmailChip(attendeeInput);
    } else if (
      e.key === "Backspace" &&
      attendeeInput === "" &&
      emails.length > 0
    ) {
      removeEmail(emails.length - 1);
    }
  }

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof typeof formData, string>>
  >({});
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Reset logic...
      const now = new Date();
      const roundedMinutes = Math.ceil(now.getMinutes() / 30) * 30;
      now.setMinutes(roundedMinutes);
      const defaultToTime = now.toTimeString().slice(0, 5);

      now.setMinutes(roundedMinutes - 30);
      const defaultFromTime = now.toTimeString().slice(0, 5);

      setFormData((prev) => ({
        ...prev,
        from: defaultFromTime,
        to: defaultToTime,
        date: new Date(),
      }));

      setTimeout(() => titleRef.current?.focus(), 100);
      setFormErrors({});
      setLoading(false); // Ensure loading is reset on open
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.date) errors.date = "Date is required";
    if (!formData.from.trim()) errors.from = "Start time is required";
    if (!formData.to.trim()) errors.to = "End time is required";
    if (!emails.length) errors.attendees = "At least one attendee is required";

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);
      await onCreateMeeting({
        title: formData.title,
        date: formData.date.toISOString().split("T")[0],
        from: formData.from,
        to: formData.to,
        description: formData.description || "",
        attendees: emails,
      });

      setFormData({
        title: "",
        date: new Date(),
        from: "",
        to: "",
        description: "",
        attendees: [],
      });
      setEmails([]);
      setAttendeeInput("");

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create meeting", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white shadow-2xl rounded-2xl max-w-lg w-full p-8 border border-slate-200">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">
            Create New Meeting
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Fill in the details below to schedule a meeting.
          </p>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              ref={titleRef}
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((f) => ({ ...f, title: e.target.value }))
              }
              disabled={loading}
              placeholder="e.g. Design Review"
              className={formErrors.title ? "border-red-500" : ""}
            />
            {formErrors.title && (
              <p className="text-sm text-red-500 mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    formErrors.date ? "border-red-500" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.date ? (
                    format(formData.date, "PPP")
                  ) : (
                    <span>Select a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) =>
                    date && setFormData((f) => ({ ...f, date }))
                  }
                  disabled={loading}
                />
              </PopoverContent>
            </Popover>
            {formErrors.date && (
              <p className="text-sm text-red-500 mt-1">{formErrors.date}</p>
            )}
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="time"
                value={formData.from}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, from: e.target.value }))
                }
                disabled={loading}
                className={formErrors.from ? "border-red-500" : ""}
              />
              {formErrors.from && (
                <p className="text-sm text-red-500 mt-1">{formErrors.from}</p>
              )}
            </div>
            <div className="w-1/2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="time"
                value={formData.to}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, to: e.target.value }))
                }
                disabled={loading}
                className={formErrors.to ? "border-red-500" : ""}
              />
              {formErrors.to && (
                <p className="text-sm text-red-500 mt-1">{formErrors.to}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="attendees">Attendee Emails</Label>
            <div
              className={`flex flex-wrap items-center gap-2 px-2 py-2 min-h-[44px] border rounded-lg bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow ${
                formErrors.attendees ? "border-red-500" : "border-slate-300"
              }`}
              onClick={() => emailInputRef.current?.focus()}
            >
              {emails.map((email, idx) => (
                <span
                  key={email + idx}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    isValidEmail(email)
                      ? "bg-indigo-100 text-indigo-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {email}
                  <button
                    type="button"
                    className="ml-1 text-xs text-slate-400 hover:text-slate-700 focus:outline-none"
                    onClick={() => removeEmail(idx)}
                    aria-label={`Remove ${email}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="attendees"
                ref={emailInputRef}
                type="text"
                value={attendeeInput}
                onChange={handleAttendeeInputChange}
                onKeyDown={handleAttendeeInputKeyDown}
                placeholder={
                  emails.length === 0
                    ? "Type email and press Enter"
                    : "Add more..."
                }
                className="flex-1 border-none bg-transparent outline-none py-1 min-w-[120px] text-sm"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {emails.length} attendee{emails.length !== 1 ? "s" : ""}
            </div>
            {formErrors.attendees && (
              <p className="text-sm text-red-500 mt-1">
                {formErrors.attendees}
              </p>
            )}
          </div>

          {emails.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-full bg-indigo-50 text-indigo-700 text-sm rounded-md px-3 py-2 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-indigo-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M12 20c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z"
                  />
                </svg>
                Attendees will be notified via email or calendar invite.
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add meeting notes or agenda..."
              value={formData.description}
              onChange={(e) =>
                setFormData((f) => ({ ...f, description: e.target.value }))
              }
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full mt-4" disabled={loading}>
            {loading ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              "Create Meeting"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
