"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Mail, 
  MousePointer2, 
  TrendingUp 
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

import { useAppStore } from "@/store/useAppStore";
import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

const barData = [
  { name: 'Cold Email', value: 400 },
  { name: 'LinkedIn', value: 300 },
  { name: 'Follow-up', value: 200 },
  { name: 'Referral', value: 278 },
];

export default function DashboardPage() {
  const [realtimeStats, setRealtimeStats] = useState({
    total_leads: 0,
    emails_sent: 0,
    reply_rate: 0,
    conversion_rate: 0
  });
  const [trendData, setTrendData] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchRealtimeData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token}` };
        
        const statsRes = await axios.get(`${API_URL}/analytics/stats`, { headers });
        setRealtimeStats(statsRes.data);

        const trendsRes = await axios.get(`${API_URL}/analytics/trends`, { headers });
        // Process trend data into chart format
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const chartMap: any = {};
        
        // Initialize last 7 days
        for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          chartMap[days[d.getDay()]] = { name: days[d.getDay()], sent: 0, replies: 0 };
        }

        trendsRes.data.forEach((item: any) => {
          const day = days[new Date(item.created_at).getDay()];
          if (chartMap[day]) {
            if (item.status === 'sent') chartMap[day].sent++;
            if (item.status === 'replied') chartMap[day].replies++;
          }
        });

        setTrendData(Object.values(chartMap));
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

    fetchRealtimeData();
  }, []);

  const stats = useMemo(() => {
    return [
      { label: "Total Leads", value: realtimeStats.total_leads.toLocaleString(), icon: Users, change: "+0%" },
      { label: "Emails Sent", value: realtimeStats.emails_sent.toLocaleString(), icon: Mail, change: "+0%" },
      { label: "Reply Rate", value: `${realtimeStats.reply_rate}%`, icon: MousePointer2, change: "+0%" },
      { label: "Conversion", value: `${realtimeStats.conversion_rate}%`, icon: TrendingUp, change: "+0%" },
    ];
  }, [realtimeStats]);

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
        <div className="glass p-8 rounded-2xl h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Performance Trend (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.length > 0 ? trendData : []}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass p-8 rounded-2xl h-[400px]">
          <h3 className="text-lg font-semibold mb-6">Lead Sources</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
