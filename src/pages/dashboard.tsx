// src/pages/dashboard.tsx
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Copy, Share2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddMeetingModal from "@/components/AddMeetingModal";

interface Attendee {
  id: string;
  email: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string; // ISO format
  from: string;
  to: string;
  description?: string;
  attendees: Attendee[];
}

interface Stats {
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
        // API returns { meetings: Meeting[] }
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
      setStats((prev) => ({
        ...prev,
        meetings: prev.meetings + 1,
        slotsFilled:
          prev.slotsFilled + (result.bookings.attendees?.length || 0),
        attendees: prev.attendees + (result.bookings.attendees?.length || 0),
      }));
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = () => {
    const meetingId = genRandomMeetingId();
    const meetingUrl = `/meeting/${meetingId}`;

    const fullUrl = `${window.location.origin}${meetingUrl}`;

    window.open(fullUrl, "_blank");
  };

  return (
    <DashboardLayout>
      {/* Main dashboard content starts here */}
      <div className="space-y-10">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Your Booking Link</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 break-words">
                {bookingUrl || "Loading..."}
              </p>
            </div>
            <div className="flex gap-2 mt-3 sm:mt-0">
              <Button
                variant="outline"
                onClick={handleCopy}
                disabled={!bookingUrl}
              >
                <Copy className="w-4 h-4 mr-1" />
                {copySuccess ? "Copied" : "Copy"}
              </Button>
              <Button variant="outline">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button onClick={() => setModalOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Create New Meeting
          </Button>
          <Button variant="secondary">Manage Availability</Button>
        </div>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            Upcoming Meetings
          </h2>
          {loading ? (
            <p className="text-muted-foreground">Loading meetings...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : meetings.length === 0 ? (
            <p className="text-muted-foreground">No upcoming meetings.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-md font-medium">
                      📆 {new Date(meeting.date).toLocaleString()} (
                      {meeting.from} - {meeting.to})
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {meeting.title}
                    </p>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      👥 {meeting.attendees?.length || 0} Attendee
                      {meeting.attendees?.length !== 1 ? "s" : ""}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={joinMeeting}>
                        Join
                      </Button>
                      <Button variant="secondary" size="sm">
                        Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-slate-800">
            Your Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.meetings}
                </p>
                <p className="text-sm text-muted-foreground">Meetings Hosted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.slotsFilled}
                </p>
                <p className="text-sm text-muted-foreground">Slots Filled</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {stats.attendees}
                </p>
                <p className="text-sm text-muted-foreground">Total Attendees</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Create Meeting Modal */}
      <AddMeetingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreateMeeting={handleCreateMeeting}
      />
    </DashboardLayout>
  );
}
