// src/pages/dashboard.tsx
import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  PlusCircle,
  ExternalLink,
  Calendar,
  Users,
  Clock,
  CalendarPlus,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddMeetingModal from "@/components/AddMeetingModal";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { joinMeeting } from "@/utlis/constants";
import {
  format,
  isToday,
  isTomorrow,
  differenceInMinutes,
  parseISO,
} from "date-fns";

interface Attendee {
  id: string;
  email: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  from: string;
  to: string;
  description?: string;
  attendees: Attendee[];
}

export interface Stats {
  meetings: number;
  slotsFilled: number;
  attendees: number;
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    meetings: 0,
    slotsFilled: 0,
    attendees: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) throw new Error("User not found");
        const user = JSON.parse(userStr);
        const res = await fetch(`/api/bookings?userId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch meetings");
        const data = await res.json();
        setMeetings(data.meetings || []);
        setStats({
          meetings: data.meetings?.length || 0,
          slotsFilled:
            data.meetings?.reduce(
              (sum: number, m: Meeting) => sum + (m.attendees?.length || 0),
              0
            ) || 0,
          attendees:
            data.meetings?.reduce(
              (sum: number, m: Meeting) => sum + (m.attendees?.length || 0),
              0
            ) || 0,
        });
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Get next upcoming meeting
  const nextMeeting = useMemo(() => {
    const now = new Date();
    const upcoming = meetings
      .filter((m) => {
        const meetingDateTime = parseISO(`${m.date.split("T")[0]}T${m.from}`);
        return meetingDateTime > now;
      })
      .sort((a, b) => {
        const dateA = parseISO(`${a.date.split("T")[0]}T${a.from}`);
        const dateB = parseISO(`${b.date.split("T")[0]}T${b.from}`);
        return dateA.getTime() - dateB.getTime();
      });
    return upcoming[0] || null;
  }, [meetings]);

  // Get today's meetings
  const todaysMeetings = useMemo(() => {
    return meetings.filter((m) => isToday(parseISO(m.date)));
  }, [meetings]);

  // Calculate time until next meeting
  const getTimeUntilMeeting = (meeting: Meeting) => {
    const meetingDateTime = parseISO(
      `${meeting.date.split("T")[0]}T${meeting.from}`
    );
    const now = new Date();
    const minutes = differenceInMinutes(meetingDateTime, now);

    if (minutes < 60) return `in ${minutes}m`;
    if (minutes < 1440) return `in ${Math.floor(minutes / 60)}h`;
    return `in ${Math.floor(minutes / 1440)}d`;
  };

  const handleCreateMeeting = async (data: {
    title: string;
    date: string;
    from: string;
    to: string;
    description?: string;
    attendees: string[];
  }) => {
    setLoading(true);
    setError(null);
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
      setStats((prev) => ({
        ...prev,
        meetings: prev.meetings + 1,
        slotsFilled: prev.slotsFilled + (result.booking.attendees?.length || 0),
        attendees: prev.attendees + (result.booking.attendees?.length || 0),
      }));

      toast.success("Meeting created!", {
        description: "Reminder set for 1 minute before start time.",
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error(err.message);
      } else {
        setError("Unknown error");
        toast.error("Failed to create meeting");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-1">
              Manage your meetings and availability
            </p>
          </div>
          {/* <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Meeting
          </Button> */}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">
                    Total Meetings
                  </p>
                  <p className="text-4xl font-bold mt-2">{stats.meetings}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">
                    Slots Filled
                  </p>
                  <p className="text-4xl font-bold mt-2">{stats.slotsFilled}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">
                    Total Attendees
                  </p>
                  <p className="text-4xl font-bold mt-2">{stats.attendees}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Meeting Preview & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Next Meeting Card */}
          {nextMeeting ? (
            <Card className="border-slate-200 shadow-lg bg-gradient-to-br from-slate-50 to-indigo-50 overflow-hidden relative">
              <CardContent className="p-6">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-600 text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      Next Meeting
                    </h3>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                      {getTimeUntilMeeting(nextMeeting)}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold mb-2 line-clamp-1 text-slate-900">
                    {nextMeeting.title}
                  </h4>

                  <div className="flex flex-col gap-1.5 text-sm text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {isToday(parseISO(nextMeeting.date))
                          ? "Today"
                          : isTomorrow(parseISO(nextMeeting.date))
                          ? "Tomorrow"
                          : format(parseISO(nextMeeting.date), "MMM d")}
                      </span>
                      <span className="mx-1">•</span>
                      <span>
                        {nextMeeting.from} - {nextMeeting.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>
                        {nextMeeting.attendees?.length || 0} attendees
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => joinMeeting()}
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Join Now
                  </Button>
                </div>

                {/* Decorative BG */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-indigo-200/30 blur-3xl rounded-full pointer-events-none" />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mb-3">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">
                  No upcoming meetings
                </p>
                <p className="text-sm text-slate-500">
                  Schedule your next meeting
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions Card */}
          <Card className="border-slate-200 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => setModalOpen(true)}
                className="w-full justify-start h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md transition-all rounded-xl"
              >
                <CalendarPlus className="w-5 h-5 mr-2" />
                Schedule New Meeting
              </Button>

              <Button
                onClick={() => router.push("/calendar")}
                className="w-full justify-start"
                variant="outline"
              >
                <Calendar className="w-4 h-4 mr-2" />
                View Calendar
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>

              {/* Today's Summary */}
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">
                    Today&apos;s Meetings
                  </span>
                  <span className="text-2xl font-bold text-slate-900">
                    {todaysMeetings.length}
                  </span>
                </div>
                {todaysMeetings.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {todaysMeetings.reduce(
                      (sum, m) => sum + (m.attendees?.length || 0),
                      0
                    )}{" "}
                    total attendees
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Meetings Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Upcoming Meetings
            </h2>
            {meetings.filter((m) => {
              const meetingDateTime = parseISO(
                `${m.date.split("T")[0]}T${m.from}`
              );
              return meetingDateTime > new Date();
            }).length > 0 && (
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {
                  meetings.filter((m) => {
                    const meetingDateTime = parseISO(
                      `${m.date.split("T")[0]}T${m.from}`
                    );
                    return meetingDateTime > new Date();
                  }).length
                }{" "}
                scheduled
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          ) : meetings.filter((m) => {
              const meetingDateTime = parseISO(
                `${m.date.split("T")[0]}T${m.from}`
              );
              return meetingDateTime > new Date();
            }).length === 0 ? (
            <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
              <CardContent className="p-16 text-center">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-slate-900 font-semibold text-lg mb-2">
                  No upcoming meetings
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  Create your first meeting to get started
                </p>
                <Button onClick={() => setModalOpen(true)}>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Meeting
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings
                .filter((m) => {
                  const meetingDateTime = parseISO(
                    `${m.date.split("T")[0]}T${m.from}`
                  );
                  return meetingDateTime > new Date();
                })
                .sort((a, b) => {
                  const dateA = parseISO(`${a.date.split("T")[0]}T${a.from}`);
                  const dateB = parseISO(`${b.date.split("T")[0]}T${b.from}`);
                  return dateA.getTime() - dateB.getTime();
                })
                .map((meeting) => {
                  const meetingDateTime = parseISO(
                    `${meeting.date.split("T")[0]}T${meeting.from}`
                  );
                  const minutesUntil = differenceInMinutes(
                    meetingDateTime,
                    new Date()
                  );
                  const isStartingSoon = minutesUntil < 60 && minutesUntil > 0;

                  return (
                    <Card
                      key={meeting.id}
                      className={`border-slate-200 hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${
                        isStartingSoon
                          ? "ring-2 ring-indigo-500 ring-offset-2"
                          : ""
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-2 flex-1">
                            {meeting.title}
                          </CardTitle>
                          {isStartingSoon && (
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                              Starting soon
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span>
                              {isToday(parseISO(meeting.date))
                                ? "Today"
                                : isTomorrow(parseISO(meeting.date))
                                ? "Tomorrow"
                                : format(parseISO(meeting.date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>
                              {meeting.from} - {meeting.to}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-violet-600 flex-shrink-0" />
                            <span>
                              {meeting.attendees?.length || 0} attendee
                              {meeting.attendees?.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            size="sm"
                            onClick={() => joinMeeting()}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Join
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/calendar?date=${
                                  meeting.date.split("T")[0]
                                }&time=${meeting.from}`
                              )
                            }
                            className="w-full"
                          >
                            Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </section>
      </div>

      <AddMeetingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreateMeeting={handleCreateMeeting}
      />
    </DashboardLayout>
  );
}
