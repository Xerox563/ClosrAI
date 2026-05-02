"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { 
  LayoutDashboard, 
  Users, 
  Mail, 
  Settings, 
  LogOut,
  BarChart3,
  Search,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Search, label: "Discovery", href: "/dashboard/search" },
  { icon: Mail, label: "Campaigns", href: "/dashboard/campaigns" },
  { icon: Users, label: "Leads", href: "/dashboard/leads" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="w-64 h-screen border-r border-white/5 bg-[#0a0a0a] flex flex-col p-4 fixed left-0 top-0">
      <div className="mb-10 px-4 py-4">
        <Link href="/dashboard" className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs">C</div>
          <span>Closr<span className="text-blue-500">AI</span></span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "text-white/40 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={18} className={isActive ? "text-white" : "group-hover:text-white"} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        {/* Issue Pill */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between group cursor-pointer hover:bg-red-500/20 transition-colors">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">1 Issue</span>
          </div>
          <ChevronDown size={14} className="text-red-500/40 group-hover:text-red-500" />
        </div>

        {/* User Profile */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
            {user?.email?.charAt(0).toUpperCase() || "N"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.user_metadata?.full_name || "Neeraj"}</p>
            <p className="text-[10px] text-white/30 truncate">{user?.email || "neeraj@acme.com"}</p>
          </div>
          <ChevronDown size={14} className="text-white/20" />
        </div>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/30 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 w-full"
        >
          <LogOut size={18} />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
};
