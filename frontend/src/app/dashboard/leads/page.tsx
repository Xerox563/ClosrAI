"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Upload, 
  Search, 
  MoreHorizontal,
  Mail,
  CheckCircle2,
  Clock
} from "lucide-react";
import Papa from "papaparse";
import { useAppStore } from "@/store/useAppStore";
import { LeadDrawer } from "@/components/dashboard/LeadDrawer";
import axios from "axios";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LeadsPage() {
  const { leads, setLeads, addLead, setSelectedLead } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const supabase = createClient();

  // Fetch leads on mount
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const response = await axios.get(`${API_URL}/leads`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        setLeads(response.data);
      } catch (error) {
        console.error("Failed to fetch leads", error);
      }
    };
    fetchLeads();
  }, [setLeads, supabase.auth]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const { data: { session } } = await supabase.auth.getSession();
        for (const row of results.data as any[]) {
          if (row.email && row.name) {
            try {
              const response = await axios.post(`${API_URL}/leads`, {
                name: row.name,
                email: row.email,
                company: row.company || "Unknown",
                status: "New"
              }, {
                headers: {
                  Authorization: `Bearer ${session?.access_token}`
                }
              });
              addLead(response.data);
            } catch (error) {
              console.error("Failed to sync lead to DB", error);
            }
          }
        }
        setIsUploading(false);
      },
    });
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leads</h1>
          <p className="text-white/40 text-lg">Manage and track your cold outreach prospects.</p>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition-colors cursor-pointer text-sm font-medium">
            <Upload size={18} />
            {isUploading ? "Uploading..." : "Import CSV"}
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors text-sm font-medium">
            <Plus size={18} />
            Add Lead
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-white/40 text-sm font-medium border-b border-white/10">
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Added</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead) => (
                  <motion.tr
                    key={lead.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedLead(lead)}
                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{lead.name}</span>
                        <span className="text-sm text-white/40">{lead.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-white/60">{lead.company}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        lead.status === "New" ? "bg-blue-500/10 text-blue-400" :
                        lead.status === "Emailed" ? "bg-purple-500/10 text-purple-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {lead.status === "New" ? <Clock size={12} /> :
                         lead.status === "Emailed" ? <Mail size={12} /> :
                         <CheckCircle2 size={12} />}
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/40 text-sm">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 group-hover:text-white">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredLeads.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-white/20 text-lg">No leads found. Start by importing a CSV.</p>
            </div>
          )}
        </div>
      </div>
      <LeadDrawer />
    </div>
  );
}
