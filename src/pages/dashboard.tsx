// src/pages/dashboard.tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Copy,
  Share2,
  PlusCircle,
  ExternalLink,
  Calendar,
  Users,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddMeetingModal from "@/components/AddMeetingModal";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { joinMeeting } from "@/utlis/constants";

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
  const [bookingUrl, setBookingUrl] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    meetings: 0,
    slotsFilled: 0,
    attendees: 0,
  });
  const [copySuccess, setCopySuccess] = useState(false);
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
        setBookingUrl(`https://devmeet.com/book/${user.email?.split("@")[0]}`);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
        else setError("Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopySuccess(true);
    toast.success("Link copied!");
    setTimeout(() => setCopySuccess(false), 2000);
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
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/30"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create Meeting
          </Button>
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

          <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-emerald-100 text-sm font-medium">
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

          <Card className="border-none shadow-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white overflow-hidden relative">
            <CardContent className="p-6">
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-violet-100 text-sm font-medium">
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

        {/* Booking Link */}
        <Card className="border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              Your Booking Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <p className="text-sm text-slate-700 font-mono break-all">
                  {bookingUrl || "Loading..."}
                </p>
              </div>
              <Button
                onClick={handleCopy}
                disabled={!bookingUrl}
                variant="outline"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copySuccess ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Meetings Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Upcoming Meetings
            </h2>
            {meetings.length > 0 && (
              <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {meetings.length} scheduled
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
          ) : meetings.length === 0 ? (
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
            <div className="grid md:grid-cols-2 gap-4">
              {meetings.map((meeting) => (
                <Card
                  key={meeting.id}
                  className="border-slate-200 hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 mb-2">
                          {meeting.title}
                        </CardTitle>
                        <div className="flex flex-col gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span>
                              {new Date(meeting.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-emerald-600" />
                            <span>
                              {meeting.from} - {meeting.to}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-violet-600" />
                            <span>
                              {meeting.attendees?.length || 0} attendee
                              {meeting.attendees?.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => joinMeeting()}
                        className="flex-1"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Join
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(
                            `/calendar?date=${meeting.date.split("T")[0]}`
                          )
                        }
                      >
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
