import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, profile } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Work', path: '/work' },
    { name: 'Services', path: '/services' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled || menuOpen ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'
        }`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          {/* Logo Column - Flex 1 to balance the right side */}
          <div className="flex-1 flex justify-start items-center">
            <Link to="/" className="z-10 hover:opacity-80 transition-opacity flex-shrink-0">
              <img src={logo} alt="RevLabs" className="h-8 w-auto object-contain" />
            </Link>
          </div>

          {/* Desktop Nav - Absolute Center (visually) */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-md border border-white/10 rounded-full p-1">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-4 py-1.5 rounded-full font-sans text-sm transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            {user && (
              <Link
                to="/dashboard"
                className={`px-4 py-1.5 rounded-full font-sans text-sm transition-all duration-300 ${
                  location.pathname === '/dashboard'
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-4 py-1.5 rounded-full font-sans text-sm transition-all duration-300 ${
                  location.pathname.startsWith('/admin')
                    ? 'text-white bg-white/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Auth / Mobile Toggle Column - Flex 1 to balance the left side */}
          <div className="flex-1 flex justify-end items-center gap-4">
            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <div className="flex flex-col items-end">
                    <span className="text-white/80 font-sans text-[13px]">
                      Hi, {(profile?.full_name || user?.email || 'User').split(' ')[0]}
                    </span>
                    {isAdmin && (
                      <span className="text-[9px] font-sans font-bold text-white/30 tracking-widest uppercase">
                        Admin
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-1.5 rounded-full font-sans text-sm text-white border border-white/10 hover:bg-white/5 transition-colors duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-white/60 hover:text-white font-sans text-sm transition-colors duration-300">
                    Login
                  </Link>
                  <Link to="/signup" className="px-5 py-2 bg-white text-black rounded-full font-sans text-sm font-medium hover:bg-white/90 transition-colors duration-300">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 text-white z-10 transition-transform active:scale-95 bg-transparent"
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Full-Screen Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-black flex flex-col pt-24 px-8 pb-12 overflow-y-auto"
          >
            {/* Nav Links */}
            <nav className="flex flex-col gap-2 flex-1">
              {links.map((link, idx) => {
                const isActive = location.pathname === link.path;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <Link
                      to={link.path}
                      className={`block text-4xl font-sans font-light py-3 border-b border-white/5 transition-colors ${
                        isActive ? 'text-white' : 'text-white/50 hover:text-white'
                      }`}
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}
              {user && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: links.length * 0.06 }}>
                  <Link
                    to="/dashboard"
                    className={`block text-4xl font-sans font-light py-3 border-b border-white/5 transition-colors ${
                      location.pathname === '/dashboard' ? 'text-white' : 'text-white/50 hover:text-white'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    Dashboard
                  </Link>
                </motion.div>
              )}
              {isAdmin && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: (links.length + 1) * 0.06 }}>
                  <Link
                    to="/admin"
                    className={`block text-4xl font-sans font-light py-3 border-b border-white/5 transition-colors ${
                      location.pathname.startsWith('/admin') ? 'text-white' : 'text-white/50 hover:text-white'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    Admin
                  </Link>
                </motion.div>
              )}
            </nav>

            {/* Mobile Auth Footer */}
            <div className="pt-8 flex flex-col gap-3">
              {user ? (
                <>
                  <p className="text-white/40 font-sans text-sm">
                    Signed in as {profile?.full_name || user?.email}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3.5 rounded-full font-sans text-sm text-white border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-full py-3.5 rounded-full font-sans text-sm text-center text-white border border-white/20 hover:bg-white/10 transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="w-full py-3.5 rounded-full font-sans text-sm font-medium text-center bg-white text-black hover:bg-white/90 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
