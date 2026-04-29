"use client";

import { motion } from "framer-motion";
import { Mail, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function OutreachPage() {
  const { leads } = useAppStore();
  const emailedLeads = leads.filter(l => l.status === "Emailed" || l.status === "Replied");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Outreach Tracking</h1>
        <p className="text-white/40 text-lg">Monitor your active email campaigns and replies.</p>
      </div>

      <div className="grid gap-4">
        {emailedLeads.length > 0 ? emailedLeads.map((lead, i) => (
          <motion.div
            key={lead.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass p-6 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-white">{lead.name}</h3>
                <p className="text-sm text-white/40">{lead.company} • {lead.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className={`flex items-center gap-1.5 text-sm font-medium ${
                  lead.status === "Replied" ? "text-emerald-400" : "text-blue-400"
                }`}>
                  {lead.status === "Replied" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {lead.status}
                </span>
                <span className="text-xs text-white/20">Sent 2 hours ago</span>
              </div>
              <button className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <ArrowUpRight size={18} />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="glass p-20 rounded-2xl text-center">
            <div className="p-4 rounded-full bg-white/5 text-white/10 w-fit mx-auto mb-4">
              <Mail size={48} />
            </div>
            <p className="text-white/40 text-lg">No outreach history yet. Start emailing your leads!</p>
          </div>
        )}
      </div>
    </div>
  );
}
