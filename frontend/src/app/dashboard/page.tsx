"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Mail, 
  MousePointer2, 
  TrendingUp 
} from "lucide-react";

const stats = [
  { label: "Total Leads", value: "1,284", icon: Users, change: "+12.5%" },
  { label: "Emails Sent", value: "842", icon: Mail, change: "+18.2%" },
  { label: "Reply Rate", value: "24.5%", icon: MousePointer2, change: "+4.1%" },
  { label: "Conversion", value: "12.8%", icon: TrendingUp, change: "+2.4%" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
        <p className="text-white/40 text-lg">Real-time performance of your AI sales team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <stat.icon size={24} />
              </div>
              <span className="text-emerald-400 text-sm font-medium">{stat.change}</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-white/40 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-2xl h-[400px] flex items-center justify-center text-white/20">
          Analytics Chart Placeholder
        </div>
        <div className="glass p-8 rounded-2xl h-[400px] flex items-center justify-center text-white/20">
          Recent Activity Placeholder
        </div>
      </div>
    </div>
  );
}
