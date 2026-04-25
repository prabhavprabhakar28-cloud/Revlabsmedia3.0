import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Accordion({ title = "View Details", details }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-6 border-t border-white/10 pt-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-sans text-sm text-white/70 hover:text-white transition-colors"
      >
        <span className="tracking-wide uppercase text-xs">{title}</span>
        <motion.span 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          transition={{ duration: 0.3 }}
          className="text-white/50"
        >
          ▼
        </motion.span>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 pb-2 space-y-3">
              {details.map((detail, idx) => (
                <div key={idx}>
                  <h4 className="text-white/90 font-sans text-xs uppercase tracking-widest mb-1">{detail.label}</h4>
                  <p className="text-white/50 font-sans text-sm leading-relaxed">{detail.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
