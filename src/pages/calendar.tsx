import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

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

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Filter meetings by selected date
  // Set selectedDate on client only to avoid hydration mismatch
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) throw new Error("User not found");
    const USER_ID = JSON.parse(userStr).id;
    if (selectedDate === null || !USER_ID) return;
    setLoading(true);
    const dateStr = formatDate(selectedDate);
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
              defaultMonth={selectedDate}
              selected={selectedDate}
              onSelect={setSelectedDate}
              captionLayout="dropdown"
              className="rounded-lg border shadow-sm"
            />
            {/* <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-lg border"
            /> */}
          </div>

          {/* Meetings for selected date */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Meetings on {selectedDate?.toLocaleDateString()}
              </h2>
              <Button variant="outline" className="gap-2">
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
                      <Button variant="secondary" size="sm">
                        Join
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
