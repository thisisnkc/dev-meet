import { useState, useEffect, useMemo, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Search,
  Plus,
  Clock,
  FileText,
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
import { Input } from "@/components/ui/input";
import EventDetailsModal from "@/components/EventDetailsModal";

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
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter(); // Use useRouter to read query params

  // Generate days for the week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  }, [currentDate]);

  const startDate = weekDays[0];
  const endDate = weekDays[6];

  // Auto-scroll to time if specified in URL
  useEffect(() => {
    if (router.query.time && scrollContainerRef.current) {
      const timeStr = router.query.time as string; // HH:mm
      const [hours, minutes] = timeStr.split(":").map(Number);

      const HOUR_HEIGHT = 130;
      // Calculate position: (hours + minutes/60) * height
      // Subtract strict padding (e.g. 50px) to show a bit of context above the event
      const scrollTop = (hours + minutes / 60) * HOUR_HEIGHT - 50;

      scrollContainerRef.current.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
    }
  }, [router.query.time, meetings]); // Run when time param exists or meetings load

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
    const HOUR_HEIGHT = 130; // px - Increased for better visibility

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
    // Enforce a sensible minimum height that allows at least title + time to render cleanly
    const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, 60);

    return {
      top,
      height, // Return number directly
    };
  };

  /**
   * Layout algorithm for overlapping events
   * Returns a map of eventId -> { width: string, left: string }
   */
  const calculateDailyLayout = (dailyMeetings: Meeting[]) => {
    // 1. Sort by start time. Secondarily by duration (longest first)
    const sorted = [...dailyMeetings].sort((a, b) => {
      const startA = parse(a.from, "HH:mm", new Date()).getTime();
      const startB = parse(b.from, "HH:mm", new Date()).getTime();
      if (startA !== startB) return startA - startB;

      const endA = parse(a.to, "HH:mm", new Date()).getTime();
      const endB = parse(b.to, "HH:mm", new Date()).getTime();
      return endB - startB - (endA - startA);
    });

    const positions = new Map<string, { left: string; width: string }>();
    if (sorted.length === 0) return positions;

    // 2. Group into conflicting clusters
    const clusters: Meeting[][] = [];
    let currentCluster: Meeting[] = [sorted[0]];
    let clusterEnd = parse(sorted[0].to, "HH:mm", new Date()).getTime();

    for (let i = 1; i < sorted.length; i++) {
      const meeting = sorted[i];
      const start = parse(meeting.from, "HH:mm", new Date()).getTime();
      const end = parse(meeting.to, "HH:mm", new Date()).getTime();

      if (start < clusterEnd) {
        // Overlap detected, add to cluster
        currentCluster.push(meeting);
        clusterEnd = Math.max(clusterEnd, end);
      } else {
        // No overlap, seal current cluster and start new
        clusters.push(currentCluster);
        currentCluster = [meeting];
        clusterEnd = end;
      }
    }
    clusters.push(currentCluster);

    // 3. Process each cluster to assign columns
    clusters.forEach((cluster) => {
      // Simple greedy column packing
      const columns: Meeting[][] = [];

      cluster.forEach((event) => {
        const start = parse(event.from, "HH:mm", new Date()).getTime();
        let placed = false;

        // Try to fit in existing columns
        for (let i = 0; i < columns.length; i++) {
          const lastEventInCol = columns[i][columns[i].length - 1];
          const lastEnd = parse(
            lastEventInCol.to,
            "HH:mm",
            new Date()
          ).getTime();

          if (start >= lastEnd) {
            columns[i].push(event);
            // Temporary storage: col index
            positions.set(event.id, {
              left: i.toString(),
              width: "0",
            });
            placed = true;
            break;
          }
        }

        if (!placed) {
          // New column
          columns.push([event]);
          positions.set(event.id, {
            left: (columns.length - 1).toString(),
            width: "0",
          });
        }
      });

      // 4. Finalize styles for this cluster
      const totalColumns = columns.length;
      const widthPercent = 100 / totalColumns; // e.g. 50% if 2 cols

      cluster.forEach((event) => {
        const colIndex = parseInt(positions.get(event.id)?.left || "0");
        positions.set(event.id, {
          width: `calc(${widthPercent}% - 6px)`, // Subtract gap
          left: `calc(${colIndex * widthPercent}% + 3px)`, // Add left offset
        });
      });
    });

    return positions;
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

  /* Pastel Color Palette to match standard calendar aesthetics */
  const cardColors = [
    {
      bg: "bg-blue-50",
      border: "border-blue-500",
      text: "text-blue-900",
      muted: "text-blue-700/80",
    },
    {
      bg: "bg-orange-50",
      border: "border-orange-500",
      text: "text-orange-900",
      muted: "text-orange-700/80",
    },
    {
      bg: "bg-green-50",
      border: "border-green-600",
      text: "text-green-900",
      muted: "text-green-700/80",
    },
    {
      bg: "bg-purple-50",
      border: "border-purple-500",
      text: "text-purple-900",
      muted: "text-purple-700/80",
    },
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
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b border-slate-200 bg-white z-10 sticky top-0">
                {/* Time Column Header */}
                <div className="col-span-1 border-r border-slate-100 flex items-center justify-center p-4">
                  <span className="text-xs font-semibold text-slate-400">
                    IST
                  </span>
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
              <div
                ref={scrollContainerRef}
                className="overflow-y-auto relative h-[calc(100vh-320px)] sm:h-auto"
              >
                <div className="grid grid-cols-8 relative min-h-[1920px]">
                  {/* Time Column */}
                  <div className="col-span-1 border-r border-slate-100 bg-slate-50/30">
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        style={{ height: "130px" }}
                        className="border-b border-slate-100 relative"
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

                    // Calculate layout for the entire day's events
                    const layoutMap = calculateDailyLayout(dayMeetings);

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
                            style={{ height: "130px" }}
                            className="border-b border-slate-50 last:border-b-0"
                          />
                        ))}

                        {/* Events */}
                        {dayMeetings.map((meeting) => {
                          const style = getEventStyle(meeting);
                          const { width, left } = layoutMap.get(meeting.id) || {
                            width: "calc(100% - 8px)",
                            left: "4px",
                          };

                          const colorTheme =
                            cardColors[
                              meeting.id.charCodeAt(0) % cardColors.length
                            ];

                          const height = style.height;
                          // With 130px/hr, 60px is roughly 30 mins
                          const isCompact = height < 80;

                          return (
                            <div
                              key={meeting.id}
                              style={{
                                top: `${style.top}px`,
                                height: `${style.height}px`,
                                left,
                                width,
                              }}
                              className={`absolute rounded-md text-xs overflow-hidden cursor-pointer transition-all border-l-[4px] group flex flex-col hover:z-50 hover:shadow-xl ${colorTheme.bg} ${colorTheme.border} ${colorTheme.text}`}
                              onClick={() => {
                                setSelectedMeeting(meeting);
                                setDetailsModalOpen(true);
                              }}
                            >
                              <div className="p-2 flex flex-col h-full">
                                {/* Header Section */}
                                <div className="flex justify-between items-start gap-1">
                                  <div
                                    className={`font-bold leading-tight ${
                                      isCompact
                                        ? "line-clamp-1"
                                        : "line-clamp-2"
                                    }`}
                                  >
                                    {meeting.title}
                                  </div>
                                </div>

                                {/* Time Section - Always show unless extremley tiny, but with new height min=60 it should fit */}
                                <div
                                  className={`mt-1 flex items-center gap-1.5 text-[10px] font-medium ${colorTheme.muted}`}
                                >
                                  <Clock className="w-3 h-3 flex-shrink-0" />
                                  <span className="whitespace-nowrap">
                                    {meeting.from} - {meeting.to}
                                  </span>
                                </div>

                                {/* Expanded Content (Details & Avatar) - Only for taller events */}
                                {!isCompact && (
                                  <>
                                    {meeting.description && (
                                      <div
                                        className={`mt-2 flex items-start gap-1.5 text-[10px] ${colorTheme.muted} line-clamp-2`}
                                      >
                                        {/* Using a dot or simple icon for description */}
                                        <FileText className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                        <span className="opacity-90">
                                          {meeting.description}
                                        </span>
                                      </div>
                                    )}
                                    <div className="flex-1" /> {/* Spacer */}
                                    <div className="mt-auto pt-2 flex items-center justify-between border-t border-black/5">
                                      <span
                                        className={`text-[10px] font-semibold ${colorTheme.muted} opacity-75`}
                                      >
                                        Consultation
                                      </span>

                                      {meeting.attendees.length > 0 && (
                                        <div className="flex -space-x-2">
                                          {meeting.attendees
                                            .slice(0, 3)
                                            .map((u, i) => (
                                              <div
                                                key={i}
                                                className="w-5 h-5 rounded-full bg-white border border-white flex items-center justify-center text-[9px] font-bold shadow-sm uppercase tracking-tighter"
                                                title={u.email}
                                                style={{
                                                  color: "var(--color-text)",
                                                }} // Fallback
                                              >
                                                {u.email[0]}
                                              </div>
                                            ))}
                                          {meeting.attendees.length > 3 && (
                                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-white flex items-center justify-center text-[8px] font-bold text-slate-500 shadow-sm z-10">
                                              +{meeting.attendees.length - 3}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
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
        </div>
      </div>

      <AddMeetingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onCreateMeeting={handleCreateMeeting}
      />

      <EventDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        meeting={selectedMeeting}
        onDelete={(id) =>
          setMeetings((prev) => prev.filter((m) => m.id !== id))
        }
      />
    </DashboardLayout>
  );
}
