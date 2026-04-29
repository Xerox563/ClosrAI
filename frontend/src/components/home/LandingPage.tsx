"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle2, Sparkles, Zap, Shield, Mail } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleField } from "./ParticleField";

gsap.registerPlugin(ScrollTrigger);

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

      {/* How it works (n8n style flow) */}
      <section className="reveal-section py-32 px-6 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Built for results.</h2>
            <p className="text-white/40 text-xl max-w-2xl mx-auto">Three steps to dominate your market with AI-powered scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connection lines (visible on desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
            
            {[
              { 
                step: "01", 
                title: "Import Leads", 
                desc: "Upload your CSV or add leads manually. We handle the data structuring.",
                icon: Users
              },
              { 
                step: "02", 
                title: "AI Synthesis", 
                desc: "Gemini 2.0 analyzes lead data and crafts hyper-personalized messages.",
                icon: Zap
              },
              { 
                step: "03", 
                title: "Scale Send", 
                desc: "Send through Resend with high deliverability and real-time tracking.",
                icon: Mail
              }
            ].map((item, i) => (
              <div key={i} className="relative z-10 glass-card p-10 rounded-[2.5rem] hover:glow transition-all duration-500 group">
                <div className="text-6xl font-black text-white/5 mb-8 group-hover:text-blue-500/10 transition-colors">
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/40 leading-relaxed text-lg">{item.desc}</p>
              </div>
            ))}
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
                  { title: "Real-time Analytics", desc: "Track opens, clicks, and replies the second they happen.", icon: BarChart3 },
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
const Users = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const BarChart3 = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
