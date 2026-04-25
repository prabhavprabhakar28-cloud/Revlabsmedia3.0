import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, profile } = useAuth();

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="z-10 hover:opacity-80 transition-opacity flex-shrink-0">
          <img src={logo} alt="RevLabs" className="h-8 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-2 justify-center flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-4 py-2 rounded-full font-sans text-sm transition-colors duration-300 ${
                  isActive ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          {user && (
            <Link
              to="/dashboard"
              className={`relative px-4 py-2 rounded-full font-sans text-sm transition-colors duration-300 ${
                location.pathname === '/dashboard' ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={`relative px-4 py-2 rounded-full font-sans text-sm transition-colors duration-300 ${
                location.pathname.startsWith('/admin') ? 'text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Admin
            </Link>
          )}
        </nav>
        <div className="hidden md:flex items-center gap-4 flex-shrink-0">
          {user ? (
            <>
              <div className="flex flex-col items-end">
                <span className="text-white/80 font-sans text-sm">
                  Hi, {(profile?.full_name || user?.email || 'User').split(' ')[0]}
                </span>
                {isAdmin && (
                  <span className="text-[10px] font-sans font-bold text-white/40 tracking-widest uppercase">
                    Admin
                  </span>
                )}
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-full font-sans text-sm text-white border border-white/20 hover:bg-white/10 transition-colors duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-white/70 hover:text-white font-sans text-sm transition-colors duration-300">
                Login
              </Link>
              <Link to="/signup" className="px-5 py-2 bg-white text-black rounded-full font-sans text-sm font-medium hover:bg-white/90 transition-colors duration-300">
                Sign Up
              </Link>
            </>
          )}
        </div>
        <div className="md:hidden flex items-center gap-4">
          {!user ? (
            <Link to="/login" className="text-white/70 hover:text-white text-sm">Login</Link>
          ) : (
            <button onClick={handleLogout} className="text-white/70 hover:text-white text-sm">Logout</button>
          )}
        </div>
      </div>
    </header>
  );
}
