"use client";

import { motion } from "framer-motion";
import { Save, Bot, Mail, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    full_name: "",
    sender_name: "",
    company_name: "",
    calendly_link: "",
  });
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      if (response.data) {
        setProfile({
          full_name: response.data.full_name || "",
          sender_name: response.data.sender_name || "",
          company_name: response.data.company_name || "",
          calendly_link: response.data.calendly_link || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.post(`${API_URL}/profile`, profile, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Failed to save settings", error);
      alert("Failed to save settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-white/40 text-lg">Configure your AI agent and integration keys.</p>
      </div>

      <div className="grid gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-2xl space-y-6"
        >
          <div className="flex items-center gap-3 text-blue-400">
            <Bot size={24} />
            <h2 className="text-xl font-semibold text-white">AI Configuration</h2>
          </div>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Preferred Provider</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors">
                <option>OpenRouter (Recommended for reliability)</option>
                <option>Google Gemini (Direct)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">OpenRouter Model</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="google/gemini-2.0-flash-001"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">System Prompt</label>
              <textarea 
                className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors resize-none"
                placeholder="You are a senior sales representative..."
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-2xl space-y-6"
        >
          <div className="flex items-center gap-3 text-purple-400">
            <Mail size={24} />
            <h2 className="text-xl font-semibold text-white">Email Configuration</h2>
          </div>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Full Name</label>
              <input 
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Sender Name (Visible to Leads)</label>
              <input 
                type="text"
                value={profile.sender_name}
                onChange={(e) => setProfile({ ...profile, sender_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="John from SalesAgent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Company Name</label>
              <input 
                type="text"
                value={profile.company_name}
                onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="Your Company"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Calendly Link</label>
              <input 
                type="text"
                value={profile.calendly_link}
                onChange={(e) => setProfile({ ...profile, calendly_link: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="https://calendly.com/your-link"
              />
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors font-bold"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
