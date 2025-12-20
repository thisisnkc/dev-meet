"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useSocketContext } from "@/context/SocketContext";

export type Notification = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  read: boolean;
  meetingId: string;
};

import { useRef } from "react";
import { joinMeeting } from "@/utlis/constants";

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { socket } = useSocketContext();

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Fetch user ID from localStorage once
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const { id } = JSON.parse(userStr);
      setUserId(id);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNotify = (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);

      if (!open) {
        toast.info(notification.title, {
          description: notification.description,
          duration: 10000,
          action: {
            label: "Join",
            onClick: () => joinMeeting(notification.meetingId),
          },
        });
        if (typeof window !== "undefined") {
          new Audio("/sounds/notify.mp3").play();
        }
      }
    };

    socket.on("notification", onNotify);
    return () => {
      socket.off("notification", onNotify);
    };
  }, [socket, open]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      toast.error("Failed to load notifications");
    }
  }, [userId]);

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Also fetch when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = async () => {
    if (!userId) return;

    await fetch(`/api/notifications/mark-all-read/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/mark-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const calculateDuration = (createdAt: string) => {
    const createdAtDate = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - createdAtDate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} days ago`;
    if (hours > 0) return `${hours} hours ago`;
    if (minutes > 0) return `${minutes} minutes ago`;
    return `${seconds} seconds ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-slate-100"
        onClick={() => setOpen((v) => !v)}
        aria-label="Show notifications"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <span className="font-semibold text-slate-800">Notifications</span>
            <div className="flex gap-2">
              <button
                className="text-xs text-indigo-600 hover:underline"
                onClick={markAllAsRead}
                disabled={notifications.length === 0}
              >
                Mark all as read
              </button>
              {/* <button
                className="text-xs text-red-500 hover:underline"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                Clear all
              </button> */}
            </div>
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="py-8 text-center text-slate-400">
                No notifications
              </li>
            ) : (
              notifications.map((n, i) => (
                <li
                  key={i}
                  className={`border-b border-slate-100 last:border-b-0 transition-colors hover:bg-slate-50 ${
                    n.read ? "bg-white" : "bg-indigo-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3 px-4 py-3">
                    {n.read ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    ) : (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 mb-0.5">
                        {n.title}
                      </div>
                      <div className="text-sm text-slate-600 mb-1">
                        {n.description}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-slate-400">
                          {calculateDuration(n.createdAt)}
                        </div>
                        {!n.read && (
                          <button
                            onClick={() => markAsRead(n.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
