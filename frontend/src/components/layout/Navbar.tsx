"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-black/20"
    >
      <Link href="/" className="text-xl font-bold tracking-tighter">
        SalesAgent<span className="text-blue-500">AI</span>
      </Link>
      
      <div className="flex items-center gap-8 text-sm font-medium text-white/70">
        <Link href="#features" className="hover:text-white transition-colors">Features</Link>
        <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
        <Link href="/login" className="px-4 py-2 rounded-full glass hover:bg-white/10 transition-colors">
          Login
        </Link>
        <Link href="/signup" className="px-4 py-2 rounded-full bg-white text-black hover:bg-white/90 transition-colors">
          Get Started
        </Link>
      </div>
    </motion.nav>
  );
};
