import React from 'react';
import { motion } from 'framer-motion';
import CTASection from '../components/CTASection';
import { useSEO } from '../hooks/useSEO';

export default function About() {
  useSEO({ title: 'About Us', description: 'Learn about RevLabs Media House — our story, team, and vision for world-class creative production.', canonical: '/about' });
  const timeline = [
    { year: '2024', title: 'Started Freelancing', description: 'Began working with creators and brands, building high-performing edits and cinematic content independently.' },
    { year: '2025', title: 'Started Expanding', description: 'Scaled operations, built a growing creative team, and started working with international clients.' },
    { year: '2026', title: 'Launched Revlabs Media', description: 'Officially launched Revlabs Media as a premium creative agency focused on cinematic storytelling and viral content production.' }
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-24 min-h-screen">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-24"
        >
          <h1 className="text-4xl sm:text-6xl font-sans font-light mb-8 max-w-2xl leading-tight">
            We are <span className="font-serif italic">RevLabs</span>
          </h1>
          <p className="text-xl font-sans text-white/80 leading-relaxed">
            RevLabs Media House is a creative agency focused on delivering high-quality video content and visual storytelling. We help brands and creators scale through precision editing and performance-driven content systems.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl font-sans font-medium border-b border-white/10 pb-6 mb-12">Our Journey</h2>
          <div className="space-y-16 pl-4 border-l border-white/20">
            {timeline.map((item, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="relative pl-8"
              >
                <div className="absolute w-3 h-3 bg-white rounded-full -left-[23px] top-2 shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                <div className="text-white/50 font-sans tracking-widest text-sm mb-2">{item.year}</div>
                <h3 className="text-2xl font-serif italic mb-2">{item.title}</h3>
                <p className="text-white/70 font-sans">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
      <CTASection />
    </>
  );
}
