import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '../context/AnimationContext';
import logo from '../assets/logo.png';

export default function CinematicPreloader() {
  const { hasPlayedIntro, markIntroPlayed } = useAnimation();
  const [phase, setPhase] = useState('hidden'); // hidden -> fade-in -> hold -> zoom -> done

  useEffect(() => {
    if (hasPlayedIntro) return;

    // Sequence:
    // 1. Black screen (0 to 0.5s)
    // 2. Logo fade in + scale up (0.5s to 2s)
    // 3. Hold moment (2s to 3s)
    // 4. Logo zooms forward filling screen (3s to 4s)
    
    // Start fade-in shortly after mount
    const t1 = setTimeout(() => setPhase('fade-in'), 500);
    
    // Hold
    const t2 = setTimeout(() => setPhase('hold'), 2500);
    
    // Zoom
    const t3 = setTimeout(() => setPhase('zoom'), 3200);
    
    // Done
    const t4 = setTimeout(() => {
      setPhase('done');
      markIntroPlayed();
    }, 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [hasPlayedIntro, markIntroPlayed]);

  if (hasPlayedIntro || phase === 'done') return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: phase === 'fade-in' || phase === 'hold' || phase === 'zoom' ? 1 : 0,
            scale: phase === 'zoom' ? 50 : (phase === 'fade-in' || phase === 'hold' ? 1.05 : 0.9),
            filter: phase === 'zoom' ? 'blur(10px)' : 'blur(0px)'
          }}
          transition={{
            opacity: { duration: 1.5, ease: "easeOut" },
            scale: { 
              duration: phase === 'zoom' ? 0.8 : 2.5, 
              ease: phase === 'zoom' ? [0.64, 0, 0.78, 0] : "easeOut"
            },
            filter: { duration: 0.6 }
          }}
        >
          <img src={logo} alt="REVLABS" className="h-16 md:h-24 w-auto object-contain" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
