import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar as CalendarIcon } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { PlusCircle, Clock, Users, Calendar, ExternalLink } from "lucide-react";
import AddMeetingModal from "@/components/AddMeetingModal";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { joinMeeting } from "@/utlis/constants";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  type Meeting = {
    id: number;
    title: string;
    date: string;
    from: string;
    to: string;
    attendees: { id: string; email: string }[];
  };

  const router = useRouter();
  const { date: query_date } = router.query;
  const [modalOpen, setModalOpen] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

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
    if (!userStr) return;
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
      const res = await fetch("/api/bookings", {
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
      setMeetings((prev) => [result.booking, ...prev]);
      toast.success("Meeting created successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create meeting"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDate) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
            <p className="text-slate-600 mt-1">
              View and manage your scheduled meetings
            </p>
          </div>
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add Meeting
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Selector */}
          <Card className="lg:col-span-1 border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Select Date
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CalendarIcon
                mode="single"
                selected={selectedDate}
                month={query_date ? selectedDate : undefined}
                onSelect={(date) => setSelectedDate(date ?? null)}
                captionLayout="dropdown"
                className="rounded-lg"
                required={false}
              />
            </CardContent>
          </Card>

          {/* Meetings List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h2>
                {meetings.length > 0 && (
                  <p className="text-sm text-slate-600 mt-1">
                    {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}{" "}
                    scheduled
                  </p>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              </div>
            ) : meetings.length === 0 ? (
              <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
                <CardContent className="p-16 text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-indigo-600" />
                  </div>
                  <p className="text-slate-900 font-semibold text-lg mb-2">
                    No meetings scheduled
                  </p>
                  <p className="text-sm text-slate-500 mb-6">
                    Add a meeting for {selectedDate.toLocaleDateString()}
                  </p>
                  <Button onClick={() => setModalOpen(true)}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Meeting
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {meetings.map((meeting) => (
                  <Card
                    key={meeting.id}
                    className="border-slate-200 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-900 mb-3">
                            {meeting.title}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-emerald-600" />
                              <span>
                                {meeting.from} - {meeting.to}
                              </span>
                            </div>
                            <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full"></div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-violet-600" />
                              <span>
                                {meeting.attendees?.length || 0} attendee
                                {meeting.attendees?.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => joinMeeting()}
                          className="flex-shrink-0"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Join
                        </Button>
                      </div>
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
