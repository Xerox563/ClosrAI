"use client";

import { motion } from "framer-motion";
import { ParticleField } from "./ParticleField";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-20">
      <ParticleField />
      
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full glass text-sm font-medium mb-6 text-blue-400">
            Introducing SalesAgent AI 0.1
          </span>
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight mb-8 text-gradient leading-[1.1]">
            Your AI Sales Team. <br /> On Autopilot.
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automate cold outreach with hyper-personalized emails written by Gemini AI. 
            Add leads, generate, and send in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-white/90 transition-colors"
            >
              Get Started for Free <ArrowRight size={18} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-full glass font-semibold hover:bg-white/10 transition-colors"
            >
              Watch Demo
            </motion.button>
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black to-transparent pointer-events-none" />
    </section>
  );
};
