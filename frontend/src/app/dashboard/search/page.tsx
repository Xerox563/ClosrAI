"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Globe, 
  Building2, 
  UserPlus,
  Sparkles,
  Zap,
  X,
  Mail as MailIcon,
  MapPin,
  CheckCircle2
} from "lucide-react";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

interface LeadResult {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  location: string;
  linkedin: string;
  bio?: string;
  enriched?: boolean;
  verified?: boolean;
}

export default function LeadSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLeadForPopup, setSelectedLeadForPopup] = useState<LeadResult | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setCampaigns(response.data);
      if (response.data.length > 0) {
        setSelectedCampaignId(response.data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsSearching(true);
    setResults([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        alert("Your session has expired. Please log out and log back in.");
        setIsSearching(false);
        return;
      }

      const response = await axios.post(`${API_URL}/search-leads`, { query }, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setResults(response.data);
    } catch (error: any) {
      console.error("Search failed", error);
      if (error.response?.status === 401) {
        alert("Authentication failed. Please try logging out and in again.");
      } else {
        alert("Search failed. Please check your internet connection or try again later.");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddToCampaign = async () => {
    if (selectedLeads.length === 0 || !selectedCampaignId) return;
    
    setIsAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const leadsToAdd = results.filter(r => selectedLeads.includes(r.id));
      
      for (const lead of leadsToAdd) {
        await axios.post(`${API_URL}/leads`, {
          name: lead.name,
          email: lead.email,
          company: lead.company,
          role: lead.role,
          location: lead.location,
          campaign_id: selectedCampaignId,
          status: "New"
        }, {
          headers: { Authorization: `Bearer ${session?.access_token}` }
        });
      }
      
      alert(`Successfully added ${selectedLeads.length} leads to campaign!`);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Failed to add leads to campaign", error);
      alert("Failed to add leads to campaign.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Lead Discovery</h1>
          <p className="text-white/40 text-lg">Search and enrich prospects from across the web.</p>
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem] relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-10 -z-10" />
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text"
              placeholder="Search by industry, role, or company (e.g., SaaS Founders in SF)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:border-blue-500 outline-none transition-colors text-lg"
            />
          </div>
          <button 
            type="submit"
            disabled={isSearching}
            className="px-8 py-4 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-all font-bold flex items-center gap-2"
          >
            {isSearching ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Find Leads <Zap size={18} fill="currentColor" /></>
            )}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
           <AnimatePresence mode="popLayout">
             {results.map((lead) => (
               <motion.div
                 key={lead.id}
                 layout
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={`neon-card p-6 rounded-3xl flex items-center justify-between group cursor-pointer transition-all ${
                   selectedLeads.includes(lead.id) ? 'border-blue-500/50 bg-blue-500/5' : ''
                 }`}
                 onClick={(e) => {
                    // Only open popup if clicking the name/info area, not the selection circle
                    setSelectedLeadForPopup(lead);
                 }}
               >
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xl font-bold text-blue-400 group-hover:scale-110 transition-transform">
                       {lead.name?.charAt(0) || '?'}
                    </div>
                    <div>
                       <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">{lead.name || 'Unknown Lead'}</h3>
                       <p className="text-white/40 text-sm">{lead.role || 'No Title'} @ {lead.company || 'Unknown'}</p>
                       <div className="flex gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-white/20">
                             <Globe size={10} /> {lead.location || 'Remote'}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-blue-400">
                          <Globe size={16} />
                       </button>
                    </div>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLeadSelection(lead.id);
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        selectedLeads.includes(lead.id) ? 'bg-blue-500 border-blue-500' : 'border-white/10'
                      }`}
                    >
                       {selectedLeads.includes(lead.id) && <Plus size={14} className="text-white" />}
                    </div>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>

           {results.length === 0 && !isSearching && (
             <div className="glass p-20 rounded-[3rem] text-center">
                <div className="p-6 rounded-full bg-white/5 text-white/10 w-fit mx-auto mb-6">
                   <Search size={48} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Discover New Opportunities</h3>
                <p className="text-white/40">Enter a search query to pull live lead data from our global database.</p>
             </div>
           )}
        </div>

        <div className="space-y-6">
           <div className="glass p-8 rounded-[2.5rem] sticky top-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                Selected Leads
                <span className="ml-auto bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-black">
                  {selectedLeads.length}
                </span>
              </h3>
              
              <div className="space-y-4 mb-8">
                 {selectedLeads.length > 0 ? (
                   results.filter(r => selectedLeads.includes(r.id)).map(lead => (
                     <div key={lead.id} className="flex items-center gap-3 text-sm text-white/60 bg-white/5 p-3 rounded-xl">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        {lead.name}
                     </div>
                   ))
                 ) : (
                   <p className="text-white/20 text-center py-4">No leads selected yet.</p>
                 )}
              </div>

              {selectedLeads.length > 0 && (
                <div className="space-y-4 mb-6">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Select Campaign</label>
                  <select 
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors text-sm"
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {campaigns.length === 0 && <option value="">No campaigns found</option>}
                  </select>
                </div>
              )}

              <button 
                onClick={handleAddToCampaign}
                disabled={selectedLeads.length === 0 || !selectedCampaignId || isAdding}
                className="w-full py-4 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {isAdding ? (
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    Add to Campaign
                  </>
                )}
              </button>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedLeadForPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLeadForPopup(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="absolute top-6 right-6 z-10">
                <button 
                  onClick={() => setSelectedLeadForPopup(null)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl font-bold text-blue-400">
                    {selectedLeadForPopup.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedLeadForPopup.name}</h2>
                    <p className="text-blue-400 font-medium">{selectedLeadForPopup.role}</p>
                    <p className="text-white/40 text-sm flex items-center gap-1 mt-1">
                      <Building2 size={14} /> {selectedLeadForPopup.company}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-colors">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-blue-400 transition-colors">
                        <MailIcon size={18} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Email Address</p>
                          {selectedLeadForPopup.verified && (
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 size={10} /> Verified via Hunter.io
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium">{selectedLeadForPopup.email}</p>
                      </div>
                    </div>

                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-blue-500/30 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-blue-400 transition-colors">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Location</p>
                      <p className="text-white font-medium">{selectedLeadForPopup.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-1">About</h4>
                  <p className="text-white/60 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 italic">
                    "{selectedLeadForPopup.bio || 'Highly skilled professional focused on delivering impact in their field.'}"
                  </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (!selectedLeads.includes(selectedLeadForPopup.id)) {
                        toggleLeadSelection(selectedLeadForPopup.id);
                      }
                      setSelectedLeadForPopup(null);
                    }}
                    className="flex-1 py-4 rounded-2xl bg-blue-500 text-white font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
                  >
                    Select Lead
                  </button>
                  <button 
                    onClick={() => window.open(selectedLeadForPopup.linkedin, '_blank')}
                    className="px-6 py-4 rounded-2xl glass hover:bg-white/10 text-white font-bold transition-all"
                  >
                    LinkedIn
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
