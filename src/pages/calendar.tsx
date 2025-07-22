import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import AddMeetingModal from "@/components/AddMeetingModal";
import { toast } from "sonner";
import { useRouter } from "next/router";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  type Meeting = {
    id: number;
    title: string;
    date: string;
    time: string;
    attendees: { id: string; email: string }[];
  };

  const router = useRouter();

  const { date: query_date } = router.query;

  const [modalOpen, setModalOpen] = useState(false);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Set selectedDate on client only to avoid hydration mismatch
  useEffect(() => {
    if (query_date && typeof query_date === "string") {
      const modifiedDate = new Date(query_date);
      if (!isNaN(modifiedDate.getTime())) {
        setSelectedDate(modifiedDate);
        return;
      }
    }
    setSelectedDate(new Date());
  }, [query_date]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not found");
    const USER_ID = JSON.parse(userStr).id;
    if (selectedDate === null || !USER_ID) return;
    setLoading(true);
    const dateStr = selectedDate.toISOString().split("T")[0];
    fetch(`/api/bookings?userId=${USER_ID}&date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        setMeetings(data.meetings || []);
        setLoading(false);
      })
      .catch(() => {
        setMeetings([]);
        setLoading(false);
      });
  }, [selectedDate]);

  const handleCreateMeeting = async (data: {
    title: string;
    date: string;
    from: string;
    to: string;
    description?: string;
    attendees: string[];
  }) => {
    setLoading(true);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("User not found");
      const user = JSON.parse(userStr);
      const res = await fetch("/api/bookings/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          title: data.title,
          date: data.date,
          from: data.from,
          to: data.to,
          description: data.description,
          attendeeEmails: data.attendees,
        }),
      });
      if (!res.ok) {
        const msg = (await res.json()).message || "Failed to create meeting";
        throw new Error(msg);
      }
      const result = await res.json();
      setMeetings((prev) => [result.bookings, ...prev]);
    } catch {
      toast("Something went wrong.", {
        closeButton: true,
        description: "Please try again.",
        duration: 5000,
        style: {
          color: "red",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDate) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto py-8 px-2 md:px-0">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Calendar selector */}
          <div className="bg-white rounded-xl shadow-md p-6 w-full md:w-1/2">
            <h2 className="text-xl font-bold mb-6 text-indigo-700">
              Select a Date
            </h2>
            <Calendar
              mode="single"
              selected={selectedDate}
              month={query_date ? selectedDate : undefined}
              onSelect={(date) => setSelectedDate(date ?? null)}
              captionLayout="dropdown"
              className="rounded-lg border shadow-sm"
              required={false}
            />
          </div>

          {/* Meetings for selected date */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Meetings on{" "}
                {selectedDate ? selectedDate.toLocaleDateString() : "-"}
              </h2>
              <Button
                variant="default"
                className="gap-2"
                onClick={() => setModalOpen(true)}
              >
                <PlusCircle className="w-5 h-5" /> Add Meeting
              </Button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-40 text-slate-500">
                Loading meetings...
              </div>
            ) : meetings.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                <span className="text-3xl mb-2">📅</span>
                <span>No meetings scheduled for this day.</span>
              </div>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <Card
                    key={meeting.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold text-indigo-700">
                        {meeting.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-600">
                          🕒 {meeting.from}
                        </div>
                        <div className="text-sm text-slate-500">
                          👥 {meeting.attendees?.length} Attendee
                          {meeting.attendees?.length !== 1 && "s"}
                        </div>
                      </div>
                      <Button size="sm">Join</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <AddMeetingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreateMeeting={handleCreateMeeting}
      />
    </DashboardLayout>
  );
}
