import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Button({ children, to, onClick, className = '', external, variant = 'primary', ...props }) {
  const baseStyle = "inline-block px-8 py-4 rounded-[2px] font-sans font-medium transition-colors duration-300";
  const primaryStyle = "bg-[#f8f8f8] text-[#171717] hover:bg-white";
  const secondaryStyle = "bg-transparent text-white border border-white/20 hover:bg-white/10";
  const activeStyle = variant === 'secondary' ? secondaryStyle : primaryStyle;
  const combinedStyle = `${baseStyle} ${activeStyle}`;
  
  if (to) {
    if (external) {
      return (
        <motion.a 
          href={to} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`${combinedStyle} ${className}`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          {...props}
        >
          {children}
        </motion.a>
      );
    }
    return (
      <Link to={to} className="block w-fit">
        <motion.div 
          className={`${combinedStyle} ${className}`}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          whileHover={{ y: -2 }}
          whileTap={{ y: 0 }}
          {...props}
        >
          {children}
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.button 
      onClick={onClick}
      className={`${combinedStyle} ${className}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
