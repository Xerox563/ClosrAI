"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Send, Copy, Check, Mail, History, Calendar } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import axios from "axios";
import confetti from "canvas-confetti";
import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

export const LeadDrawer = () => {
  const { selectedLead, setSelectedLead, updateLeadStatus } = useAppStore();
  const [emailContent, setEmailContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (selectedLead) {
      fetchHistory();
    } else {
      setHistory([]);
      setEmailContent("");
    }
  }, [selectedLead]);

  const fetchHistory = async () => {
    if (!selectedLead) return;
    setIsLoadingHistory(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get(`${API_URL}/leads/${selectedLead.id}/history`, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      setHistory(response.data);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Typewriter effect simulation
  const simulateTypewriter = (text: string) => {
    setEmailContent("");
    let i = 0;
    const interval = setInterval(() => {
      setEmailContent((prev) => prev + text.charAt(i));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 10);
  };

  const handleGenerateEmail = async () => {
    if (!selectedLead) return;
    setIsGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/generate-email`, {
        lead: {
          name: selectedLead.name,
          company: selectedLead.company,
          email: selectedLead.email
        }
      });
      simulateTypewriter(response.data.content);
    } catch (error) {
      console.error("Failed to generate email", error);
      alert("Failed to generate email. Please check your backend.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedLead || !emailContent) return;
    setIsSending(true);
    
    // Clean up content: Remove "Subject: ..." if AI included it
    let cleanContent = emailContent;
    let subject = `Partnership opportunity for ${selectedLead.company}`;
    
    if (emailContent.toLowerCase().startsWith("subject:")) {
      const parts = emailContent.split("\n");
      subject = parts[0].replace(/subject:/i, "").trim();
      cleanContent = parts.slice(1).join("\n").trim();
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      await axios.post(`${API_URL}/send-email`, {
        to_email: selectedLead.email,
        subject: subject,
        content: cleanContent
      }, {
        headers: { Authorization: `Bearer ${session?.access_token}` }
      });
      updateLeadStatus(selectedLead.id, "Emailed");
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#ffffff']
      });

      setSelectedLead(null);
    } catch (error: any) {
      console.error("Failed to send email", error);
      const msg = error.response?.data?.detail || "Failed to send email. Please check your backend.";
      alert(msg);
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedLead) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedLead(null)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl h-full bg-zinc-950 border-l border-white/10 p-8 shadow-2xl flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">{selectedLead.name}</h2>
              <p className="text-white/40">{selectedLead.company} • {selectedLead.email}</p>
            </div>
            <button 
              onClick={() => setSelectedLead(null)}
              className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto pr-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">AI Outreach</h3>
                <button
                  onClick={handleGenerateEmail}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  <Sparkles size={16} />
                  {isGenerating ? "Analyzing Lead..." : "Generate Email"}
                </button>
              </div>

              <div className="glass rounded-2xl p-6 min-h-[300px] relative group">
                {emailContent ? (
                  <div className="whitespace-pre-wrap text-white/80 leading-relaxed font-mono text-sm">
                    {emailContent}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                    <div className="p-4 rounded-full bg-white/5 text-white/20">
                      <Mail size={48} />
                    </div>
                    <p className="text-white/40 text-sm max-w-[200px]">
                      Click generate to write a hyper-personalized email.
                    </p>
                  </div>
                )}
                
                {emailContent && (
                  <button 
                    onClick={copyToClipboard}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white/40">
                <History size={16} />
                <h3 className="text-sm font-semibold uppercase tracking-wider">Outreach History</h3>
              </div>
              
              <div className="space-y-3">
                {isLoadingHistory ? (
                  <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  </div>
                ) : history.length > 0 ? (
                  history.map((item, idx) => (
                    <div key={idx} className="glass p-4 rounded-xl border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 uppercase">{item.status}</span>
                        <span className="text-[10px] text-white/20 flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(item.sent_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white/80">{item.subject}</div>
                      <div className="text-xs text-white/40 line-clamp-2 italic">"{item.body}"</div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 glass rounded-xl border-dashed border-white/10">
                    <p className="text-xs text-white/20">No outreach history yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 flex gap-4">
            <button
              onClick={handleSendEmail}
              disabled={!emailContent || isSending}
              className="flex-1 py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              <Send size={18} />
              {isSending ? "Sending..." : "Send via Resend"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
