"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Upload, 
  Search, 
  MoreHorizontal,
  Mail,
  CheckCircle2,
  Clock,
  FilterX
} from "lucide-react";
import Papa from "papaparse";
import { useAppStore } from "@/store/useAppStore";
import { LeadDrawer } from "@/components/dashboard/LeadDrawer";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

function LeadsContent() {
  const { leads, setLeads, addLead, setSelectedLead } = useAppStore();
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignFilter = searchParams.get('campaign');

  // Fetch leads and campaigns on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Fetch Leads
        const leadsResponse = await axios.get(`${API_URL}/leads`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        setLeads(leadsResponse.data);

        // Fetch Campaigns
        const campaignsResponse = await axios.get(`${API_URL}/campaigns`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        setCampaigns(campaignsResponse.data);
        
        // Set initial selected campaign from URL or first in list
        if (campaignFilter) {
          setSelectedCampaignId(campaignFilter);
        } else if (campaignsResponse.data.length > 0) {
          setSelectedCampaignId(campaignsResponse.data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }
    };
    fetchData();
  }, [setLeads, supabase.auth, campaignFilter]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedCampaignId) {
      alert("Please select a campaign first!");
      return;
    }

    setIsUploading(true);
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const { data: { session } } = await supabase.auth.getSession();
        let count = 0;
        for (const row of results.data as any[]) {
          if (row.email && row.name) {
            try {
              const response = await axios.post(`${API_URL}/leads`, {
                name: row.name,
                email: row.email,
                company: row.company || "Unknown",
                status: "New",
                campaign_id: selectedCampaignId
              }, {
                headers: {
                  Authorization: `Bearer ${session?.access_token}`
                }
              });
              addLead(response.data);
              count++;
            } catch (error) {
              console.error("Failed to sync lead to DB", error);
            }
          }
        }
        setIsUploading(false);
        alert(`Successfully imported ${count} leads!`);
      },
    });
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCampaign = campaignFilter ? lead.campaign_id === campaignFilter : true;
    
    return matchesSearch && matchesCampaign;
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Leads</h1>
          <p className="text-white/40 text-lg">
            {campaignFilter 
              ? `Showing leads for: ${campaigns.find(c => c.id === campaignFilter)?.name || 'Campaign'}` 
              : 'Manage and track your cold outreach prospects.'}
          </p>
        </div>
        <div className="flex gap-4">
          {campaignFilter && (
            <button 
              onClick={() => router.push('/dashboard/leads')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition-colors text-sm font-medium text-red-400"
            >
              <FilterX size={18} />
              Clear Filter
            </button>
          )}
          <select 
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">Select Campaign...</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-white/20">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}

