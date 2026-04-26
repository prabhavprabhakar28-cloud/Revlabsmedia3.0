import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

export default function CTASection({ title = "Ready to scale your content?", description = "Partner with RevLabs and transform your visual storytelling." }) {
  return (
    <section className="py-32 border-t border-white/10 bg-black relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-white/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-5xl md:text-7xl font-sans font-light leading-tight mb-6">
            {title.split(' ').map((word, idx, arr) => (
              idx === arr.length - 1 ? <span key={idx} className="font-serif italic">{word}</span> : `${word} `
            ))}
          </h2>
          <p className="text-xl font-sans text-white/70 mb-10 max-w-2xl mx-auto">
            {description}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button to="/services" className="px-10 py-4 text-lg">Start your project</Button>
            <Button to="/work" variant="secondary" className="px-10 py-4 text-lg hidden sm:block">View our work</Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
