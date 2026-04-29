"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2, Sparkles, Zap, Shield, Mail, Search, Calendar, Bell, LayoutDashboard, Settings, Users, BarChart3, ChevronRight, MessageSquare } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleField } from "./ParticleField";

gsap.registerPlugin(ScrollTrigger);

const CircuitIcon = () => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse" />
    <div className="relative z-10 w-16 h-16 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
      <Zap className="text-blue-400" size={32} fill="currentColor" />
    </div>
    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100">
      {/* Animated circuit paths */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <motion.path
          key={i}
          d={`M 50 50 L ${50 + 40 * Math.cos((angle * Math.PI) / 180)} ${50 + 40 * Math.sin((angle * Math.PI) / 180)}`}
          stroke="rgba(59, 130, 246, 0.3)"
          strokeWidth="1.5"
          strokeDasharray="5,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
        />
      ))}
    </svg>
  </div>
);

export const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hero Parallax
    gsap.to(".hero-content", {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero-section",
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Reveal animations for sections
    const sections = gsap.utils.toArray(".reveal-section");
    sections.forEach((section: any) => {
      gsap.fromTo(section, 
        { y: 60, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
          }
        }
      );
    });

    // Stat counters
    if (statsRef.current) {
      const stats = statsRef.current.querySelectorAll(".stat-number");
      stats.forEach((stat: any) => {
        const target = parseInt(stat.innerText);
        gsap.from(stat, {
          innerText: 0,
          duration: 2,
          snap: { innerText: 1 },
          scrollTrigger: {
            trigger: stat,
            start: "top 90%",
          }
        });
      });
    }
  }, []);

  return (
    <div ref={containerRef} className="bg-black text-white selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="hero-section relative h-screen flex items-center justify-center overflow-hidden grid-pattern">
        <ParticleField />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black" />
        
        <div className="hero-content relative z-10 max-w-5xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-white/10 text-sm font-medium mb-8 text-blue-400">
              <Sparkles size={14} className="animate-pulse" />
              <span>Next Gen Sales Automation</span>
            </div>
            <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-8 text-gradient leading-[1.05]">
              Outreach that <br /> feels human.
            </h1>
            <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              We combined Gemini 2.0 with professional sales psychology to build 
              the world's most effective cold outreach agent.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-5 rounded-full bg-white text-black font-bold text-lg flex items-center gap-3 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
              >
                Start for Free <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-5 rounded-full glass border-white/10 font-bold text-lg flex items-center gap-3 hover:bg-white/5 transition-all"
              >
                <Play size={20} fill="currentColor" /> Watch Demo
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Floating elements */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-20">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center p-2">
            <div className="w-1 h-2 bg-white rounded-full" />
          </div>
        </div>
      </section>

      {/* Features & Breakdown Section */}
      <section className="reveal-section py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">Full Functionality Breakdown</h2>
            <p className="text-white/40 text-xl">The complete OS for modern sales teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Lead Generation */}
            <div className="glass-card p-10 rounded-[2.5rem] group hover:glow transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
                  <Search size={32} />
                </div>
                <h3 className="text-3xl font-bold">01. Lead Generation</h3>
              </div>
              <ul className="space-y-4 text-white/60 text-lg mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500" /> Search by industry, role, location</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500" /> Pull from Apollo.io / Hunter.io</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-blue-500" /> Auto-enrich (LinkedIn, website, email)</li>
              </ul>
              <div className="relative h-48 bg-black/40 rounded-2xl border border-white/5 overflow-hidden p-4">
                 <div className="flex gap-3 mb-4">
                    <div className="w-1/4 h-3 bg-white/10 rounded" />
                    <div className="w-1/2 h-3 bg-white/5 rounded" />
                 </div>
                 <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <motion.div 
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className="flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-white/5" />
                        <div className="flex-1 h-2 bg-white/5 rounded" />
                      </motion.div>
                    ))}
                 </div>
                 <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent" />
              </div>
            </div>

            {/* 2. Email Automation */}
            <div className="glass-card p-10 rounded-[2.5rem] group hover:glow transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
                  <Mail size={32} />
                </div>
                <h3 className="text-3xl font-bold">02. Email Automation</h3>
              </div>
              <ul className="space-y-4 text-white/60 text-lg mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-500" /> Personalized cold emails per lead</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-500" /> Custom pain-point triggers</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-purple-500" /> Track opens, clicks, and replies</li>
              </ul>
              <div className="relative h-48 bg-black/40 rounded-2xl border border-white/5 overflow-hidden p-6">
                 <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                       <Zap size={20} className="text-purple-400" />
                    </div>
                    <div className="space-y-2">
                       <div className="w-32 h-2 bg-white/10 rounded" />
                       <div className="w-24 h-2 bg-white/5 rounded" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <motion.div 
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-full h-2 bg-white/5 rounded" 
                    />
                    <div className="w-4/5 h-2 bg-white/5 rounded" />
                    <div className="w-3/4 h-2 bg-white/5 rounded" />
                 </div>
              </div>
            </div>

            {/* 3. Follow-up Sequences */}
            <div className="glass-card p-10 rounded-[2.5rem] group hover:glow transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-3xl font-bold">03. Follow-up Sequences</h3>
              </div>
              <ul className="space-y-4 text-white/60 text-lg mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Multi-step sequences (Email 1 → 3 → 5)</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Auto-pause on reply</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-500" /> Natural AI rewriting per step</li>
              </ul>
              <div className="flex gap-4 h-48">
                 {[1, 2, 3].map(i => (
                   <motion.div 
                     key={i}
                     initial={{ scale: 0.8, opacity: 0 }}
                     whileInView={{ scale: 1, opacity: 1 }}
                     transition={{ delay: i * 0.1 }}
                     className="flex-1 glass border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center gap-3"
                   >
                     <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        {i}
                     </div>
                     <div className="w-full h-1 bg-white/10 rounded" />
                   </motion.div>
                 ))}
              </div>
            </div>

            {/* 4. Meeting Booking */}
            <div className="glass-card p-10 rounded-[2.5rem] group hover:glow transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-400">
                  <Calendar size={32} />
                </div>
                <h3 className="text-3xl font-bold">04. Meeting Booking</h3>
              </div>
              <ul className="space-y-4 text-white/60 text-lg mb-8">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500" /> Detect positive replies with AI</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500" /> Auto-send Calendly links</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-orange-500" /> Automatic calendar confirmation</li>
              </ul>
              <div className="relative h-48 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center p-8">
                 <div className="w-full glass-card p-4 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                       <Calendar size={24} />
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="w-24 h-2 bg-white/10 rounded" />
                       <div className="w-32 h-2 bg-white/5 rounded" />
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                       BOOKED
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign & Stats Visualization */}
      <section className="reveal-section py-32 px-6">
        <div className="max-w-7xl mx-auto glass-card rounded-[3rem] p-12 md:p-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/5 blur-[120px] rounded-full translate-x-1/2" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">Advanced Campaign Management</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 {[
                   { icon: LayoutDashboard, title: "Pipeline View", desc: "Contacted → Opened → Replied" },
                   { icon: Settings, title: "Daily Limits", desc: "Stay safe with sending caps" },
                   { icon: BarChart3Icon, title: "A/B Testing", desc: "Optimize subject lines" },
                   { icon: Bell, title: "Instant Alerts", desc: "Reply notifications on mobile" }
                 ].map((item, i) => (
                   <div key={i} className="space-y-3">
                      <div className="p-3 rounded-xl glass w-fit text-blue-400">
                        <item.icon size={20} />
                      </div>
                      <h4 className="font-bold text-lg">{item.title}</h4>
                      <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="space-y-6 relative z-10">
               <div className="p-6 glass border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">A</div>
                    <div>
                      <div className="text-sm font-bold text-white">Subject A</div>
                      <div className="text-xs text-white/40">"Quick question about scale"</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">42%</div>
                    <div className="text-xs text-white/40">Open Rate</div>
                  </div>
               </div>
               <div className="p-6 glass border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">B</div>
                    <div>
                      <div className="text-sm font-bold text-white">Subject B</div>
                      <div className="text-xs text-white/40">"How OpenAI uses SalesAgent"</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-400">68%</div>
                    <div className="text-xs text-white/40">Open Rate</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works (n8n style flow) */}
      <section className="reveal-section py-32 px-6 bg-zinc-950/50 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-blue-500/5 blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Autonomous Intelligence.</h2>
            <p className="text-white/40 text-xl max-w-2xl mx-auto">The engine under the hood that drives your growth.</p>
          </div>

          <div className="flex flex-col items-center gap-12">
            <CircuitIcon />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full relative">
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
              
              {[
                { 
                  step: "DATA", 
                  title: "Lead Acquisition", 
                  desc: "Raw signals pulled from premium providers like Apollo and LinkedIn.",
                  icon: UsersIcon
                },
                { 
                  step: "BRAIN", 
                  title: "AI Synthesis", 
                  desc: "Gemini 2.0 reasons over lead data to find the perfect value hook.",
                  icon: Zap
                },
                { 
                  step: "VOICE", 
                  title: "Human Delivery", 
                  desc: "Hyper-personalized messages sent at the perfect time for replies.",
                  icon: Mail
                }
              ].map((item, i) => (
                <div key={i} className="relative z-10 glass-card p-10 rounded-[2.5rem] hover:glow transition-all duration-500 group">
                  <div className="text-xs font-black tracking-widest text-blue-500 mb-8 opacity-50 group-hover:opacity-100 transition-opacity">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-white/40 leading-relaxed text-lg">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="reveal-section py-32 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: "Emails Sent", value: "12M+", suffix: "" },
            { label: "Open Rate", value: "85", suffix: "%" },
            { label: "Reply Rate", value: "24", suffix: "%" },
            { label: "ROI Average", value: "12", suffix: "x" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl md:text-7xl font-bold mb-2 tabular-nums">
                <span className="stat-number">{stat.value}</span>{stat.suffix}
              </div>
              <div className="text-white/40 font-medium uppercase tracking-widest text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="reveal-section py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">Every detail <br /> perfected.</h2>
              <div className="space-y-8">
                {[
                  { title: "Gemini 2.0 Flash", desc: "The fastest, most capable reasoning model available today.", icon: Sparkles },
                  { title: "Real-time Analytics", desc: "Track opens, clicks, and replies the second they happen.", icon: BarChart3Icon },
                  { title: "Enterprise Security", desc: "Your data is encrypted and stays private to your organization.", icon: Shield }
                ].map((feature, i) => (
                  <div key={i} className="flex gap-6 group">
                    <div className="mt-1 p-3 rounded-2xl glass border-white/5 text-blue-400 group-hover:scale-110 transition-transform">
                      <feature.icon size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                      <p className="text-white/40 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-500/20 blur-[100px] rounded-full" />
              <div className="relative glass rounded-[3rem] border-white/10 p-4 aspect-square flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-zinc-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center">
                   {/* Simplified Dashboard Illustration */}
                   <div className="w-4/5 space-y-4">
                      <div className="h-8 w-1/3 bg-white/10 rounded-lg animate-pulse" />
                      <div className="h-32 w-full bg-white/5 rounded-2xl" />
                      <div className="grid grid-cols-3 gap-4">
                        <div className="h-20 bg-blue-500/20 rounded-xl" />
                        <div className="h-20 bg-white/5 rounded-xl" />
                        <div className="h-20 bg-white/5 rounded-xl" />
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="reveal-section py-32 bg-zinc-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Loved by founders.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Alex Rivera", role: "Founder @ ScaleAI", text: "The first tool that actually writes like me. Our reply rates tripled in one week." },
              { name: "Sarah Chen", role: "Growth @ Vercel", text: "The UI is incredible. It's the most polished sales tool I've ever used." },
              { name: "Marcus Thorne", role: "CEO @ Thorne Ventures", text: "SalesAgent AI is our unfair advantage. The ROI was clear from day one." }
            ].map((t, i) => (
              <div key={i} className="glass-card p-10 rounded-[2rem] space-y-6">
                <div className="flex gap-1 text-blue-500">
                  {[...Array(5)].map((_, i) => <Sparkles key={i} size={16} fill="currentColor" />)}
                </div>
                <p className="text-xl text-white/70 italic">"{t.text}"</p>
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-white/30 text-sm">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="reveal-section py-48 px-6 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative z-10">
          <h2 className="text-6xl md:text-8xl font-bold mb-12 tracking-tight">Ready to ship?</h2>
          <button className="px-12 py-6 rounded-full bg-white text-black font-black text-2xl hover:scale-105 transition-transform">
            Get Started Now
          </button>
          <p className="mt-8 text-white/30">No credit card required. Free 3,000 emails/month.</p>
        </div>
      </section>
    </div>
  );
};

// Simplified icon components for the mapping
const UsersIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const BarChart3Icon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
