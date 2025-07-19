// src/pages/dashboard.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Copy, Share2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddMeetingModal from "@/components/AddMeetingModal";

interface Meeting {
  id: string;
  title: string;
  date: string; // ISO format
  attendees: number;
}

interface Stats {
  meetings: number;
  slotsFilled: number;
  attendees: number;
}

import DashboardLayout from "@/components/DashboardLayout";
import { genRandomMeetingId } from "@/utlis/constants";

export default function DashboardPage() {
  const router = useRouter();
  const [bookingUrl, setBookingUrl] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<Stats>({
    meetings: 0,
    slotsFilled: 0,
    attendees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // Modal state

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        const fetchedMeetings: Meeting[] = [
          {
            id: "1",
            title: "Tech Discussion",
            date: "2025-07-19T15:00:00",
            attendees: 3,
          },
          {
            id: "2",
            title: "Product Demo",
            date: "2025-07-22T11:00:00",
            attendees: 1,
          },
        ];
        const fetchedStats = {
          meetings: 12,
          slotsFilled: 7,
          attendees: 28,
        };
        const userBookingUrl = "https://devmeet.com/book/nikhil123";

        setMeetings(fetchedMeetings);
        setStats(fetchedStats);
        setBookingUrl(userBookingUrl);
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

  const handleCreateMeeting = async (data: { title: string; date: string }) => {
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      title: data.title,
      date: new Date(data.date).toISOString(),
      attendees: 0,
    };
    setMeetings((prev) => [newMeeting, ...prev]);
  };

  const joinMeeting = () => {
    const meetingId = genRandomMeetingId();
    const meetingUrl = `/meeting/${meetingId}`;

    const fullUrl = `${window.location.origin}${meetingUrl}`;

    window.open(fullUrl, "_blank");
  };

  return (
    <DashboardLayout
      user={{
        name: "Nikhil",
        email: "nikhil@example.com",
        avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
      }}
      onLogout={() => {
        // TODO: Implement logout logic
        window.location.href = "/login";
      }}
    >
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
          ) : meetings.length === 0 ? (
            <p className="text-muted-foreground">No upcoming meetings.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {meetings.map((meeting) => (
                <Card key={meeting.id} className="border border-slate-200">
                  <CardHeader>
                    <CardTitle className="text-md font-medium">
                      📆 {new Date(meeting.date).toLocaleString()}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {meeting.title}
                    </p>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      👥 {meeting.attendees} Attendee
                      {meeting.attendees !== 1 && "s"}
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
