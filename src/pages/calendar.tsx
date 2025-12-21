import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  Video,
} from "lucide-react";
import AddMeetingModal from "@/components/AddMeetingModal";
import { toast } from "sonner";
import {
  format,
  addDays,
  startOfWeek,
  subWeeks,
  addWeeks,
  isSameDay,
  parse,
  differenceInMinutes,
} from "date-fns";
import { joinMeeting } from "@/utlis/constants";
import { Input } from "@/components/ui/input";

interface Meeting {
  id: string;
  title: string;
  date: string; // ISO date string YYYY-MM-DD
  from: string; // HH:mm
  to: string; // HH:mm
  description?: string;
  attendees: { id: string; email: string }[];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month">("week");

  // Generate days for the week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const startDate = weekDays[0];
  const endDate = weekDays[6];

  useEffect(() => {
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]); // Fetch when week changes

  const fetchMeetings = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;
      const user = JSON.parse(userStr);

      const startStr = format(startDate, "yyyy-MM-dd");
      const endStr = format(endDate, "yyyy-MM-dd");

      const res = await fetch(
        `/api/bookings?userId=${user.id}&startDate=${startStr}&endDate=${endStr}`
      );
      const data = await res.json();
      console.log("data", data.meetings);
      setMeetings(data.meetings || []);
    } catch (error) {
      console.error("Failed to fetch meetings", error);
      toast.error("Failed to load meetings");
    }
  };

  const handleCreateMeeting = async (data: {
    title: string;
    date: string;
    from: string;
    to: string;
    description?: string;
    attendees: string[];
  }) => {
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

      if (!res.ok) throw new Error("Failed to create meeting");

      const result = await res.json();
      setMeetings((prev) => [...prev, result.booking]);
      toast.success("Meeting scheduled successfully!");
    } catch {
      toast.error("Failed to schedule meeting");
    }
  };

  const navigate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToday = () => setCurrentDate(new Date());

  // Helper to calculate event position
  const getEventStyle = (meeting: Meeting) => {
    const START_HOUR = 0; // 00:00 / 12 AM
    const HOUR_HEIGHT = 80; // px

    // Parse times
    const startTime = parse(meeting.from, "HH:mm", new Date());
    const endTime = parse(meeting.to, "HH:mm", new Date());

    // Calculate minutes from start of day
    const startMinutes = differenceInMinutes(
      startTime,
      new Date().setHours(START_HOUR, 0, 0, 0)
    );
    const durationMinutes = differenceInMinutes(endTime, startTime);

    const top = (startMinutes / 60) * HOUR_HEIGHT;
    const height = (durationMinutes / 60) * HOUR_HEIGHT;

    return {
      top: `${top}px`,
      height: `${Math.max(height, 40)}px`, // Minimum height
    };
  };

  // Filter meetings for a specific date
  const getMeetingsForDate = (date: Date) => {
    return meetings.filter((m) => {
      // Handle ISO strings strictly
      const meetingDate = new Date(m.date);

      // Debug log for checking mismatches
      const match = isSameDay(meetingDate, date);
      console.log(
        `Checking ${
          m.title
        }: Meeting(${meetingDate.toISOString()}) vs Day(${date.toISOString()}) = ${match}`
      );

      return match;
    });
  };

  const hours = Array.from({ length: 24 }).map((_, i) => i); // 00:00 to 23:00

  const cardColors = [
    "bg-red-50 border-l-4 border-red-400 text-red-900",
    "bg-blue-50 border-l-4 border-blue-400 text-blue-900",
    "bg-green-50 border-l-4 border-green-400 text-green-900",
    "bg-amber-50 border-l-4 border-amber-400 text-amber-900",
    "bg-purple-50 border-l-4 border-purple-400 text-purple-900",
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-slate-700" />
              Appointments
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your weekly schedule
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative text-slate-500 hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <Input
                placeholder="Search events..."
                className="pl-9 w-64 bg-white"
              />
            </div>
            <Button
              onClick={() => setModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("prev")}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("next")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-slate-800">
            {format(currentDate, "MMMM yyyy")}
          </h2>

          <div className="flex items-center border rounded-md bg-slate-50 p-1">
            <div className="flex text-sm">
              {["Day", "Week", "Month", "Year"].map((v) => (
                <button
                  key={v}
                  onClick={() =>
                    setView(v.toLowerCase() as "day" | "week" | "month")
                  }
                  className={`px-3 py-1 rounded-md transition-all ${
                    view === v.toLowerCase()
                      ? "bg-white shadow-sm text-slate-900 font-medium"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Week View Grid */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Header Row */}
          <div className="grid grid-cols-8 border-b border-slate-200 bg-white z-10 sticky top-0">
            {/* Time Column Header */}
            <div className="col-span-1 border-r border-slate-100 flex items-center justify-center p-4">
              <span className="text-xs font-semibold text-slate-400">IST</span>
            </div>

            {/* Days Headers */}
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`col-span-1 p-4 border-r border-slate-100 text-center last:border-r-0 ${
                  isSameDay(day, new Date()) ? "bg-indigo-50/50" : ""
                }`}
              >
                <div
                  className={`text-xs font-bold mb-1 uppercase tracking-wide ${
                    isSameDay(day, new Date())
                      ? "text-indigo-600"
                      : "text-slate-500"
                  }`}
                >
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-xl font-bold ${
                    isSameDay(day, new Date())
                      ? "text-indigo-700"
                      : "text-slate-800"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable Grid Body */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="grid grid-cols-8 relative min-h-[1920px]">
              {/* Time Column */}
              <div className="col-span-1 border-r border-slate-100 bg-slate-50/30">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-20 border-b border-slate-100 relative"
                  >
                    <span className="absolute -top-3 left-0 right-0 text-center text-xs font-medium text-slate-500 bg-transparent px-1">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Days Columns */}
              {weekDays.map((day) => {
                const dayMeetings = getMeetingsForDate(day);

                // Sort meetings by start time to ensure consistent ordering calculation
                dayMeetings.sort((a, b) => {
                  const startA = parse(a.from, "HH:mm", new Date());
                  const startB = parse(b.from, "HH:mm", new Date());
                  return startA.getTime() - startB.getTime();
                });

                return (
                  <div
                    key={day.toISOString()}
                    className={`col-span-1 relative border-r border-slate-100 last:border-r-0 h-full ${
                      isSameDay(day, new Date()) ? "bg-indigo-50/10" : ""
                    }`}
                  >
                    {/* Grid Lines */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="h-20 border-b border-slate-50 last:border-b-0"
                      />
                    ))}

                    {/* Events */}
                    {dayMeetings.map((meeting) => {
                      const style = getEventStyle(meeting);
                      const colorClass =
                        cardColors[
                          meeting.id.charCodeAt(0) % cardColors.length
                        ];

                      return (
                        <div
                          key={meeting.id}
                          style={{
                            top: style.top,
                            height: style.height,
                            left: "4px",
                            right: "4px",
                          }}
                          className={`absolute rounded-md p-2 text-xs overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-all z-10 border-l-4 opacity-90 hover:opacity-100 hover:z-20 ${colorClass}`}
                          onClick={() => toast.info(`Event: ${meeting.title}`)}
                        >
                          <div className="font-semibold truncate leading-tight">
                            {meeting.title}
                          </div>
                          <div className="flex items-center gap-1 opacity-90 mt-1 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {meeting.from} - {meeting.to}
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinMeeting();
                            }}
                            className="absolute bottom-1 right-2 p-1 hover:bg-black/5 rounded-full"
                            title="Join Meeting"
                          >
                            <Video className="w-3 h-3 opacity-70" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
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
