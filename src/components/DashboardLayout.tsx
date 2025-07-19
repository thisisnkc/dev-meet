import React from "react";
import Link from "next/link";
import { LogOut, User, Calendar, LayoutDashboard, Settings } from "lucide-react";

interface DashboardLayoutProps {
  user?: { name: string; email: string; avatarUrl?: string };
  onLogout?: () => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ user, onLogout, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 px-4 py-6 space-y-6">
        <div className="text-2xl font-bold text-indigo-700 mb-8">DevMeet</div>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-slate-800 font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/meetings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-slate-800 font-medium">
            <Calendar className="w-5 h-5" /> Meetings
          </Link>
          <Link href="/availability" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-slate-800 font-medium">
            <User className="w-5 h-5" /> Availability
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-indigo-50 text-slate-800 font-medium">
            <Settings className="w-5 h-5" /> Settings
          </Link>
        </nav>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" /> Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
          <div className="md:hidden text-xl font-bold text-indigo-700">DevMeet</div>
          <div className="flex items-center gap-4 ml-auto">
            {user && (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatarUrl || "/avatar.svg"}
                  alt="User Avatar"
                  className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
                />
                <div className="hidden sm:block">
                  <div className="font-semibold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </div>
              </div>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
