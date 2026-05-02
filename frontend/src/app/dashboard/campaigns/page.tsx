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
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

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
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newSequence, setNewSequence] = useState([
    { step: 1, type: 'email', delay: 0, template: 'Initial outreach' }
  ]);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedCampaign(expandedCampaign === id ? null : id);
  };

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

  const addStep = () => {
    setNewSequence([...newSequence, { 
      step: newSequence.length + 1, 
      type: 'email', 
      delay: 3, 
      template: 'Follow-up email' 
    }]);
  };

  const removeStep = (index: number) => {
    const updated = newSequence.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 }));
    setNewSequence(updated);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...newSequence];
    updated[index] = { ...updated[index], [field]: value };
    setNewSequence(updated);
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName) return;
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const response = await axios.post(`${API_URL}/campaigns`, {
        name: newCampaignName,
        daily_limit: 50,
        sequence: newSequence
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setCampaigns([response.data, ...campaigns]);
      setNewCampaignName("");
      setNewSequence([{ step: 1, type: 'email', delay: 0, template: 'Initial outreach' }]);
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
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass p-8 rounded-[2.5rem] border-blue-500/30 border space-y-8"
            >
              <div className="space-y-4">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Campaign Name</label>
                <input 
                  autoFocus
                  type="text"
                  placeholder="e.g., Q2 SaaS Founders Outreach"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-blue-500 transition-colors text-xl"
                />
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Sequence Steps</label>
                  <button 
                    onClick={addStep}
                    className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Step
                  </button>
                </div>

                <div className="space-y-4">
                  {newSequence.map((step, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-6 relative group">
                      <div className="flex items-start gap-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                          {step.step}
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1 space-y-2">
                              <label className="text-[10px] font-bold text-white/20 uppercase">Wait Time (Days)</label>
                              <input 
                                type="number"
                                value={step.delay}
                                onChange={(e) => updateStep(idx, 'delay', parseInt(e.target.value))}
                                className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                            <div className="flex-[3] space-y-2">
                              <label className="text-[10px] font-bold text-white/20 uppercase">Step Type</label>
                              <select className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-3 text-sm outline-none focus:border-blue-500">
                                <option>Email Outreach</option>
                              </select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/20 uppercase">Email Template / AI Prompt</label>
                            <textarea 
                              value={step.template}
                              onChange={(e) => updateStep(idx, 'template', e.target.value)}
                              className="w-full h-24 bg-black/20 border border-white/10 rounded-lg py-3 px-4 text-sm outline-none focus:border-blue-500 resize-none"
                            />
                          </div>
                        </div>
                        {newSequence.length > 1 && (
                          <button 
                            onClick={() => removeStep(idx)}
                            className="p-2 text-white/10 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleCreateCampaign}
                  className="flex-1 py-4 rounded-2xl bg-white text-black font-black hover:bg-white/90 transition-colors"
                >
                  Launch Campaign
                </button>
                <button 
                  onClick={() => setIsCreating(false)}
                  className="px-8 py-4 rounded-2xl glass hover:bg-white/5 transition-colors font-bold"
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
            className={`neon-card p-6 rounded-[2rem] group transition-all ${expandedCampaign === campaign.id ? 'border-blue-500/50 ring-1 ring-blue-500/20' : ''}`}
          >
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(campaign.id)}
            >
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
                <button 
                  className={`p-3 rounded-xl glass hover:bg-white/10 text-white/40 hover:text-white transition-all ${expandedCampaign === campaign.id ? 'rotate-90 text-blue-400' : ''}`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {expandedCampaign === campaign.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-8 pt-8 border-t border-white/5 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white/20 uppercase tracking-widest">Sequence Flow</h4>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/leads?campaign=${campaign.id}`);
                        }}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                      >
                        View Leads <ChevronRight size={14} />
                      </button>
                    </div>
                    
                    <div className="grid gap-4">
                      {campaign.sequence.map((step, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {step.step}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-bold text-white/80">Step {step.step}: Email</span>
                              {step.delay > 0 && (
                                <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full">
                                  Wait {step.delay} days
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/40 truncate italic">"{step.template}"</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
