"use client";

import { motion } from "framer-motion";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e'];

export default function AnalyticsPage() {
  const [trendData, setTrendData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token}` };
        
        // Fetch stats for pie chart
        const statsRes = await axios.get(`${API_URL}/analytics/stats`, { headers });
        const s = statsRes.data.stats;
        const funnel = statsRes.data.funnel || [];
        
        // Find Replied and Sent from funnel or stats
        const replied = s.replied_count || 0;
        const sent = s.emails_sent || 0;
        const opened = s.opened_count || 0;

        setPieData([
          { name: 'Opened', value: opened },
          { name: 'Sent', value: Math.max(0, sent - opened - replied) },
          { name: 'Replied', value: replied },
          { name: 'Bounced', value: 0 },
        ]);

        // Fetch trends for bar chart
        const trendsRes = await axios.get(`${API_URL}/analytics/trends`, { headers });
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartMap: any = {};
        
        // Group by month for this view
        trendsRes.data.forEach((item: any) => {
          const month = months[new Date(item.sent_at).getMonth()];
          if (!chartMap[month]) chartMap[month] = { name: month, sent: 0, replies: 0 };
          if (item.status === 'sent') chartMap[month].sent++;
          if (item.status === 'replied') chartMap[month].replies++;
        });

        setTrendData(Object.values(chartMap));
      } catch (error) {
        console.error("Failed to fetch analytics data", error);
      }
    };

    fetchAnalyticsData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Advanced Analytics</h1>
        <p className="text-white/40 text-lg">Deep dive into your outreach performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 glass p-8 rounded-2xl h-[450px]"
        >
          <h3 className="text-lg font-semibold mb-8">Sent vs Replies</h3>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData.length > 0 ? trendData : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="replies" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-2xl h-[450px] flex flex-col"
        >
          <h3 className="text-lg font-semibold mb-8">Engagement Mix</h3>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {pieData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-white/60">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
