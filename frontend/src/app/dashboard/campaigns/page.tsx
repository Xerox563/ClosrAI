"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Clock, 
  Mail, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import axios from "axios";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  daily_limit: number;
  sequence: any[];
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await axios.get(`${API_URL}/campaigns`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      console.error("Failed to fetch campaigns", error);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName) return;
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await axios.post(`${API_URL}/campaigns`, {
        name: newCampaignName,
        daily_limit: 50,
        sequence: [
          { step: 1, type: 'email', delay: 0, template: 'Initial outreach' },
          { step: 2, type: 'email', delay: 3, template: 'First follow-up' }
        ]
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setCampaigns([response.data, ...campaigns]);
      setNewCampaignName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Failed to create campaign", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Campaigns</h1>
          <p className="text-white/40 text-lg">Manage your automated outreach sequences.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      <div className="grid gap-6">
        <AnimatePresence>
          {isCreating && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass p-6 rounded-2xl border-blue-500/30 border"
            >
              <div className="flex items-center gap-4">
                <input 
                  autoFocus
                  type="text"
                  placeholder="Campaign Name (e.g., Summer Outreach)"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 outline-none focus:border-blue-500 transition-colors"
                />
                <button 
                  onClick={handleCreateCampaign}
                  className="px-6 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-colors"
                >
                  Create
                </button>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 rounded-xl glass hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {campaigns.length > 0 ? campaigns.map((campaign, i) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="neon-card p-6 rounded-[2rem] group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${campaign.status === 'active' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                  <Play size={24} fill={campaign.status === 'active' ? 'currentColor' : 'none'} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{campaign.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/40">
                    <span className="flex items-center gap-1.5">
                      <Mail size={14} />
                      {campaign.sequence.length} Steps
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} />
                      Daily Limit: {campaign.daily_limit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                   {[...Array(3)].map((_, i) => (
                     <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800" />
                   ))}
                </div>
                <button className="p-3 rounded-xl glass hover:bg-white/10 text-white/40 hover:text-white transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-4 gap-4">
               {[
                 { label: 'Sent', value: '0' },
                 { label: 'Opened', value: '0%' },
                 { label: 'Replied', value: '0%' },
                 { label: 'Booked', value: '0' }
               ].map(stat => (
                 <div key={stat.label}>
                    <div className="text-xs font-bold text-white/20 uppercase tracking-widest mb-1">{stat.label}</div>
                    <div className="text-lg font-bold text-white/60">{stat.value}</div>
                 </div>
               ))}
            </div>
          </motion.div>
        )) : !isCreating && (
          <div className="glass p-20 rounded-[3rem] text-center">
             <div className="p-6 rounded-full bg-white/5 text-white/10 w-fit mx-auto mb-6">
                <Sparkles size={48} />
             </div>
             <h3 className="text-2xl font-bold mb-2">No Campaigns Yet</h3>
             <p className="text-white/40 mb-8 max-w-md mx-auto">Create your first automated sequence to start reaching out to leads on autopilot.</p>
             <button 
               onClick={() => setIsCreating(true)}
               className="px-8 py-4 rounded-full bg-white text-black font-bold hover:scale-105 transition-transform"
             >
               Launch First Campaign
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
