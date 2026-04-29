import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  // Security: validate the redirect path is an internal route only.
  // Prevents open-redirect attacks via crafted login links (e.g. state.from = '//evil.com').
  const rawRedirect = location.state?.from;
  const redirectPath = (rawRedirect && typeof rawRedirect === 'string' && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//'))
    ? rawRedirect
    : '/dashboard';
  const infoMessage  = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    try {
      await login(normalizedEmail, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      // Map Supabase errors to friendlier messages
      if (err.message.includes('Invalid login credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please confirm your email address before signing in.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      // Redirect happens via OAuth callback
    } catch (err) {
      console.error('Google Login Error:', err);
      setError(err.message || 'Failed to initialize Google login. Check your Supabase configuration.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#000000]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#050505] border border-white/10 rounded-[12px] p-10 shadow-2xl relative overflow-hidden"
      >
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <h2 className="text-4xl font-serif italic mb-2 text-center text-white">Welcome Back</h2>
        <p className="text-white/50 font-sans text-center mb-8">Sign in to manage your projects.</p>

        {infoMessage && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-[8px] text-blue-400 font-sans text-sm text-center">
            {infoMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-sans text-sm text-center">
            {error}
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-6 rounded-[8px] bg-white text-[#1a1a1a] font-sans font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-white/30 font-sans text-xs">or</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-white/70 font-sans text-sm tracking-wide">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-[8px] px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
              placeholder="hello@revlabs.online"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-white/70 font-sans text-sm tracking-wide">Password</label>
              <Link to="/forgot-password" className="text-white/40 font-sans text-xs hover:text-white/70 transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-[8px] px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full text-center py-4 rounded-[8px] mt-2" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </Button>
        </form>

        <p className="mt-8 text-center text-white/50 font-sans text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-white hover:underline transition-all">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
