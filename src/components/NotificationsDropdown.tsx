import React, { useState } from "react";
import { Bell, CheckCircle, XCircle } from "lucide-react";

export type Notification = {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
};

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "New Meeting Scheduled",
    description: "You have a new meeting at 3:00 PM today.",
    timestamp: "2 min ago",
    read: false,
  },
  {
    id: "2",
    title: "Profile Updated",
    description: "Your profile information was updated successfully.",
    timestamp: "1 hr ago",
    read: true,
  },
];

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const clearAll = () => setNotifications([]);

  return (
    <div className="relative">
      <button
        className="relative p-2 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              <button
                className="text-xs text-red-500 hover:underline"
                onClick={clearAll}
                disabled={notifications.length === 0}
              >
                Clear all
              </button>
            </div>
          </div>
          <ul className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <li className="py-8 text-center text-slate-400">No notifications</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    n.read ? "bg-white" : "bg-indigo-50"
                  }`}
                >
                  {n.read ? (
                    <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  ) : (
                    <XCircle className="w-5 h-5 text-indigo-400 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{n.title}</div>
                    <div className="text-xs text-slate-600 mb-1">{n.description}</div>
                    <div className="text-xs text-slate-400">{n.timestamp}</div>
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
