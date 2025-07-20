import Link from "next/link";
import { LogOut, Calendar, LayoutDashboard, Settings } from "lucide-react";
import { avatarOptions } from "@/utlis/constants";
import { useRouter } from "next/router";
import { useAtom } from "jotai";
import { emailAtom, nameAtom, avatarAtom } from "@/state/atoms";

export function SidebarContent({ onLogout }: { onLogout?: () => void }) {
  const [email] = useAtom(emailAtom);
  const [name] = useAtom(nameAtom);
  const [avatar] = useAtom(avatarAtom);
  const avatarUrl = avatarOptions[avatar];
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/meetings", label: "Calendar", icon: Calendar },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-slate-200 px-4 py-6 space-y-6">
      <div className="text-2xl font-bold text-indigo-700 mb-8">DevMeet</div>

      <div className="flex items-center gap-3 mb-4">
        <img
          src={avatarUrl || "https://randomuser.me/api/portraits/men/32.jpg"}
          className="w-9 h-9 rounded-full border border-slate-200 object-cover"
          alt="Avatar"
        />
        <div>
          <div className="font-semibold text-slate-800">{name || "User"}</div>
          <div className="text-xs text-slate-500">{email || "Email"}</div>
        </div>
      </div>

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
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={onLogout}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
}
