import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Video, Image, Layout, Globe } from 'lucide-react';

const SERVICES = [
  { icon: Video,  label: 'Video Production', desc: 'Commercials, YouTube, Reels' },
  { icon: Image,  label: 'Photography',       desc: 'Editorial, Campaign, Events' },
  { icon: Layout, label: 'Editorial Design',  desc: 'Magazines, Digital Spreads' },
  { icon: Globe,  label: 'App Development',   desc: 'Web & Mobile Products' },
];

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center px-6 py-20 text-white">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-2xl mx-auto mb-16"
      >
        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(255,255,255,0.15)]">
          <Sparkles className="w-10 h-10 text-black" />
        </div>
        <h1 className="text-5xl md:text-7xl font-sans font-light mb-6 leading-none">
          Welcome to <span className="font-serif italic">RevLabs</span>.
        </h1>
        <p className="text-white/50 font-sans text-xl leading-relaxed">
          Your account is ready. Here's what we can build for you.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mb-16"
      >
        {SERVICES.map(({ icon: Icon, label, desc }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center hover:border-white/30 hover:bg-white/[0.05] transition-all duration-300 group"
          >
            <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Icon className="w-5 h-5 text-white/60" />
            </div>
            <p className="font-sans font-medium text-sm text-white mb-1">{label}</p>
            <p className="font-sans text-[11px] text-white/30">{desc}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link
          to="/services"
          className="flex items-center gap-2 px-10 py-4 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors"
        >
          Browse Services <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-10 py-4 border border-white/20 text-white/70 rounded-full font-sans hover:bg-white/5 hover:text-white transition-colors"
        >
          Go to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
