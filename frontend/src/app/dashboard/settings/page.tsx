"use client";

import { motion } from "framer-motion";
import { Save, Bot, Mail, Shield } from "lucide-react";

export default function SettingsPage() {
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
            <h2 className="text-xl font-semibold text-white">Gemini AI Configuration</h2>
          </div>
          <div className="grid gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Model</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors">
                <option>gemini-2.0-flash (Recommended)</option>
                <option>gemini-1.5-pro</option>
              </select>
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
              <label className="text-sm font-medium text-white/60">Sender Name</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/60">Verified Domain (Resend)</label>
              <input 
                type="text"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="outreach.yourcompany.com"
              />
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-600 transition-colors font-bold">
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
