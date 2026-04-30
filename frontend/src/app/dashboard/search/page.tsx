"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Globe, 
  Linkedin, 
  Building2, 
  UserPlus,
  Sparkles,
  Zap
} from "lucide-react";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LeadResult {
  id: string;
  name: string;
  role: string;
  company: string;
  email: string;
  location: string;
  linkedin?: string;
  enriched: boolean;
}

export default function LeadSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const supabase = createClient();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setIsSearching(true);
    // Mocking lead discovery from Apollo/Hunter
    setTimeout(() => {
      const mockResults: LeadResult[] = [
        { id: '1', name: 'John Walker', role: 'CEO', company: 'TechFlow', email: 'john@techflow.io', location: 'San Francisco, CA', enriched: true, linkedin: '#' },
        { id: '2', name: 'Sarah Miller', role: 'Head of Growth', company: 'BrightScale', email: 'sarah@brightscale.com', location: 'New York, NY', enriched: true, linkedin: '#' },
        { id: '3', name: 'Alex Rivera', role: 'Founder', company: 'Nexus AI', email: 'alex@nexus.ai', location: 'Austin, TX', enriched: true, linkedin: '#' },
      ];
      setResults(mockResults);
      setIsSearching(false);
    }, 1500);
  };

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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
                 onClick={() => toggleLeadSelection(lead.id)}
               >
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-xl font-bold text-blue-400 group-hover:scale-110 transition-transform">
                       {lead.name.charAt(0)}
                    </div>
                    <div>
                       <h3 className="font-bold text-lg text-white">{lead.name}</h3>
                       <p className="text-white/40 text-sm">{lead.role} @ {lead.company}</p>
                       <div className="flex gap-3 mt-2">
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-white/20">
                             <Globe size={10} /> {lead.location}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-4">
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-[#0077B5]">
                          <Linkedin size={16} />
                       </button>
                       <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-blue-400">
                          <Globe size={16} />
                       </button>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                       selectedLeads.includes(lead.id) ? 'bg-blue-500 border-blue-500' : 'border-white/10'
                    }`}>
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

              <button 
                disabled={selectedLeads.length === 0}
                className="w-full py-4 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                <UserPlus size={18} />
                Add to Campaign
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
