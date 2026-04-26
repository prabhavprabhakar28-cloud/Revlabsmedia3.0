import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Page transition wrapper
 */
const PageWrapper = ({ children }) => {
  const location = useLocation();
  
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col min-h-screen pt-24" // pt-24 to push below fixed navbar on non-hero pages usually, but we handle hero differently later if needed
    >
      {children}
    </motion.div>
  );
};

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="bg-black min-h-screen text-white selection:bg-white/20">
      <Navbar />
      
      {/* If it's home, we don't want the pt-24 offset since we want a full screen hero */}
      <AnimatePresence mode="wait">
        {isHome ? (
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {children}
          </motion.div>
        ) : (
          <PageWrapper>{children}</PageWrapper>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
