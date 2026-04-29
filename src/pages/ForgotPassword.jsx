import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword }    = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-white/60" />
            </div>
            <h2 className="text-3xl font-serif italic mb-3 text-white">Check Your Email</h2>
            <p className="text-white/50 font-sans text-sm leading-relaxed mb-8">
              We've sent a password reset link to <strong className="text-white/80">{email}</strong>.
              Check your inbox and follow the link to reset your password.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-white/50 hover:text-white font-sans text-sm transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </motion.div>
        ) : (
          <>
            <h2 className="text-4xl font-serif italic mb-2 text-center text-white">Reset Password</h2>
            <p className="text-white/50 font-sans text-center mb-8">Enter your email and we'll send you a reset link.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-sans text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-white/70 font-sans text-sm tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0a0a] border border-white/10 rounded-[8px] px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
                  placeholder="hello@revlabs.online"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-[8px] bg-white text-black font-sans font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-8 text-center text-white/50 font-sans text-sm">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
