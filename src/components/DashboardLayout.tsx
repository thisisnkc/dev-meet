import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  LogOut,
  Calendar,
  LayoutDashboard,
  Settings,
  Menu,
} from "lucide-react";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import { useAtom } from "jotai";
import { avatarAtom, emailAtom, nameAtom } from "@/state/atoms";
import { avatarOptions } from "@/utlis/constants";
import { Drawer } from "@/components/ui/drawer";
import { useRouter } from "next/router";

interface DashboardLayoutProps {
  user?: { name: string; email: string; avatarUrl?: string };
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [email] = useAtom(emailAtom);
  const [name] = useAtom(nameAtom);
  const [avatar] = useAtom(avatarAtom);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const avatarUrl = useMemo(() => avatarOptions[avatar], [avatar]);
  const onLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  // Sidebar links config
  const links = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/calendar",
      label: "Calendar",
      icon: Calendar,
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile Drawer Sidebar */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 px-4 py-6 space-y-6 md:hidden">
          <div className="text-2xl font-bold text-indigo-700 mb-8">DevMeet</div>
          <nav className="flex-1 space-y-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                  router.pathname === href
                    ? "bg-indigo-100 text-indigo-700"
                    : "hover:bg-indigo-50 text-slate-800"
                }`}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon className="w-5 h-5" /> {label}
              </Link>
            ))}
          </nav>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </aside>
      </Drawer>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 px-4 py-6 space-y-6">
        <div className="text-2xl font-bold text-indigo-700 mb-8">DevMeet</div>
        <nav className="flex-1 space-y-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
                router.pathname === href
                  ? "bg-indigo-100 text-indigo-700"
                  : "hover:bg-indigo-50 text-slate-800"
              }`}
            >
              <Icon className="w-5 h-5" /> {label}
            </Link>
          ))}
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
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6 text-indigo-700" />
            </button>
            <span className="text-xl font-bold text-indigo-700">DevMeet</span>
          </div>
          <div className="flex items-center gap-4 ml-auto">
  <NotificationsDropdown />
  <div className="flex items-center gap-3">
    <img
      src={
        avatarUrl || "https://randomuser.me/api/portraits/men/32.jpg"
      }
      alt="User Avatar"
      className="w-9 h-9 rounded-full border border-slate-200 bg-slate-100 object-cover"
    />
    <div className="hidden sm:block">
      <div className="font-semibold text-slate-800">
        {name || "User"}
      </div>
      <div className="text-xs text-slate-500">{email || "Email"}</div>
    </div>
  </div>
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
