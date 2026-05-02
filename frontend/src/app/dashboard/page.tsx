"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  Mail, 
  MousePointer2, 
  TrendingUp,
  Calendar,
  Download,
  Info,
  ChevronDown,
  MailWarning,
  MessageSquare,
  Zap,
  Clock,
  Target,
  UserPlus
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

import { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

// --- Sub-components ---

const StatCard = ({ label, value, icon: Icon, change, trend, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass p-6 rounded-2xl relative overflow-hidden group"
  >
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
        <Icon size={24} />
      </div>
      <div className="flex flex-col items-end">
        <span className="text-emerald-400 text-sm font-medium">{change}</span>
        <div className="h-8 w-24 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    <div className="space-y-1 relative z-10">
      <h3 className="text-white/40 text-sm font-medium">{label}</h3>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-white/20 mt-2 flex items-center gap-1">
        vs last 7 days <span className="text-emerald-400">↑ 100%</span>
      </p>
    </div>
  </motion.div>
);

const ActivityItem = ({ type, content, timestamp }: any) => {
  const getIcon = () => {
    switch (type) {
      case 'sent': return <Mail size={14} className="text-blue-400" />;
      case 'replied': return <MessageSquare size={14} className="text-emerald-400" />;
      case 'opened': return <MousePointer2 size={14} className="text-purple-400" />;
      default: return <Zap size={14} className="text-amber-400" />;
    }
  };

  const getBg = () => {
    switch (type) {
      case 'sent': return 'bg-blue-400/10';
      case 'replied': return 'bg-emerald-400/10';
      case 'opened': return 'bg-purple-400/10';
      default: return 'bg-amber-400/10';
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${getBg()}`}>
          {getIcon()}
        </div>
        <span className="text-sm text-white/70">{content}</span>
      </div>
      <span className="text-xs text-white/30">{new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  );
};

const FunnelStep = ({ label, value, percentage, color, width }: any) => (
  <div className="flex items-center gap-4 group">
    <div className="w-24 text-sm text-white/40">{label}</div>
    <div className="flex-1 h-10 relative">
      <div 
        className={`absolute inset-y-0 left-0 rounded-lg ${color} transition-all duration-500`}
        style={{ width: `${width}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-medium">
        <span>{value}</span>
        <span className="text-white/40">({percentage}%)</span>
      </div>
    </div>
  </div>
);

const InsightCard = ({ title, value, description, footer, type, delay }: any) => {
  const colors: any = {
    success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    primary: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    info: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  };

  const Icon = () => {
    if (title.includes("Channel")) return <Mail size={20} />;
    if (title.includes("Time")) return <Clock size={20} />;
    if (title.includes("Campaign")) return <Target size={20} />;
    if (title.includes("Reply")) return <TrendingUp size={20} />;
    return <UserPlus size={20} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={`p-5 rounded-2xl border ${colors[type] || colors.primary} flex flex-col justify-between h-full`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">{title}</p>
          <h4 className="text-lg font-bold text-white">{value}</h4>
          <p className="text-xs opacity-80">{description}</p>
        </div>
        <div className={`p-2 rounded-xl bg-white/10`}>
          <Icon />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-white/5">
          {footer}
        </span>
        <button className="text-[10px] font-bold hover:underline">
          {title.includes("Action") ? "Import or discover leads" : title.includes("Reply") ? "Try personalization" : "View Details"}
        </button>
      </div>
    </motion.div>
  );
};

// --- Main Page ---

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers = { Authorization: `Bearer ${session?.access_token}` };
        
        const res = await axios.get(`${API_URL}/analytics/stats`, { headers });
        setData(res.data);

        // Fetch trends for the main chart
        const trendsRes = await axios.get(`${API_URL}/analytics/trends`, { headers });
        const trends = trendsRes.data || [];
        
        // Process last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          
          const dayTrends = trends.filter((t: any) => {
            const tDate = new Date(t.sent_at);
            return tDate.getDate() === date.getDate() && tDate.getMonth() === date.getMonth();
          });

          last7Days.push({
            name: dateStr,
            sent: dayTrends.filter((t: any) => t.status === 'sent').length,
            replies: dayTrends.filter((t: any) => t.status === 'replied').length,
            conversions: dayTrends.filter((t: any) => t.status === 'replied').length, // Mocking conversions as replies for now
          });
        }
        setTrendData(last7Days);

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    if (!data?.stats) return [];
    return [
      { label: "Total Leads", value: data.stats.total_leads || 0, icon: Users, change: "+0%", trend: [{value: 10}, {value: 25}, {value: 15}, {value: 40}] },
      { label: "Emails Sent", value: data.stats.emails_sent || 0, icon: Mail, change: "+0%", trend: [{value: 5}, {value: 5}, {value: 5}, {value: 5}] },
      { label: "Reply Rate", value: `${data.stats.reply_rate || 0}%`, icon: MousePointer2, change: "+0%", trend: [{value: 2}, {value: 8}, {value: 5}, {value: 12}] },
      { label: "Conversion", value: `${data.stats.conversion_rate || 0}%`, icon: TrendingUp, change: "+0%", trend: [{value: 1}, {value: 4}, {value: 3}, {value: 7}] },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard Overview</h1>
          <p className="text-white/40">Real-time performance of your AI sales team.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70">
            <Calendar size={16} />
            <span>May 9 - May 15, 2025</span>
            <ChevronDown size={14} />
          </div>
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/70 hover:bg-white/10 transition-colors">
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.1} />
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-8 rounded-2xl h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Performance Trend</h3>
              <Info size={14} className="text-white/20" />
            </div>
            <div className="flex bg-white/5 p-1 rounded-lg">
              {['7D', '30D', '90D'].map(t => (
                <button key={t} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${t === '7D' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-6 mb-6 text-xs text-white/40">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Emails Sent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Replies</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Conversions</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={2} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="replies" stroke="#10b981" strokeWidth={2} fill="url(#colorReplies)" />
                <Area type="monotone" dataKey="conversions" stroke="#a855f7" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="glass p-8 rounded-2xl h-[450px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Lead Sources</h3>
              <Info size={14} className="text-white/20" />
            </div>
            <div className="flex items-center gap-1 text-xs text-white/40 cursor-pointer hover:text-white">
              <span>All Channels</span>
              <ChevronDown size={12} />
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.sources || []} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#ffffff20" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '12px' }}
                  cursor={{ fill: '#ffffff05' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="glass p-6 rounded-2xl flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">AI Activity Feed</h3>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-1">
            {data?.activity.length > 0 ? (
              data.activity.map((item: any) => (
                <ActivityItem key={item.id} {...item} />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <MailWarning size={40} className="mb-4" />
                <p className="text-sm">No activity yet. AI is warming up.</p>
              </div>
            )}
          </div>
          <button className="mt-4 text-blue-500 text-sm font-medium hover:underline text-left">View All Activity →</button>
        </div>

        {/* Lead Funnel */}
        <div className="glass p-6 rounded-2xl h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Lead Funnel</h3>
              <Info size={14} className="text-white/20" />
            </div>
          </div>
          <div className="space-y-4">
            {data?.funnel.map((step: any, i: number) => (
              <FunnelStep 
                key={step.name}
                label={step.name}
                value={step.value}
                percentage={step.percentage}
                color={i === 0 ? "bg-blue-500" : i === 1 ? "bg-emerald-500" : i === 2 ? "bg-purple-500" : "bg-amber-500"}
                width={step.percentage}
              />
            ))}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className="text-sm text-white/40 font-medium uppercase tracking-wider">Conversion Rate</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{data?.stats.conversion_rate}%</span>
                <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                  GOOD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Campaigns */}
        <div className="glass p-6 rounded-2xl h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Top Campaigns</h3>
              <Info size={14} className="text-white/20" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pr-2">
            {data?.top_campaigns.length > 0 ? (
              <div className="space-y-1">
                <div className="grid grid-cols-5 text-[10px] uppercase tracking-wider text-white/20 font-bold mb-4 px-2">
                  <div className="col-span-2">Campaign</div>
                  <div className="text-center">Sent</div>
                  <div className="text-center">Replies</div>
                  <div className="text-right">Rate</div>
                </div>
                {data.top_campaigns.map((c: any) => (
                  <div key={c.name} className="grid grid-cols-5 items-center py-3 px-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg transition-colors">
                    <div className="col-span-2 font-medium text-sm text-white/80 truncate pr-2">{c.name}</div>
                    <div className="text-center text-xs text-white/40">{c.sent}</div>
                    <div className="text-center text-xs text-white/40">{c.replies}</div>
                    <div className="text-right text-xs font-bold text-emerald-400">{c.reply_rate}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                <Target size={40} className="mb-4" />
                <p className="text-sm mb-4">No campaign data yet. Start running campaigns to see performance here.</p>
                <button className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
                  Create Campaign
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">AI Insights</h3>
          <Info size={16} className="text-white/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {data?.insights.map((insight: any, i: number) => (
            <InsightCard 
              key={insight.title} 
              {...insight} 
              type={i === 0 ? "success" : i === 1 ? "purple" : i === 2 ? "warning" : i === 3 ? "primary" : "info"}
              delay={i * 0.05} 
            />
          ))}
          {/* Add two more mock insights to match the reference image's 5 cards */}
          {data?.insights.length === 3 && (
            <>
              <InsightCard 
                title="Reply Rate Insight"
                value="0%"
                description="Emails with personalized first line"
                footer="Try personalization"
                type="primary"
                delay={0.15}
              />
              <InsightCard 
                title="Action Recommended"
                value="Add More Leads"
                description="Low lead volume detected"
                footer="Import or discover leads"
                type="info"
                delay={0.2}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
