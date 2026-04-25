import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]                   = useState('');
  const [success, setSuccess]               = useState(false);
  const [loading, setLoading]               = useState(false);
  const [tokenValid, setTokenValid]         = useState(true);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // Supabase puts the access token in the URL hash after redirect
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) {
      setTokenValid(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8)          return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await resetPassword(password);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-black">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500/60 mx-auto mb-4" />
          <h2 className="text-2xl font-sans font-light text-white mb-2">Invalid Reset Link</h2>
          <p className="text-white/50 font-sans text-sm mb-6">This link is invalid or has expired.</p>
          <a href="/forgot-password" className="px-6 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors">
            Request New Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#000000]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#050505] border border-white/10 rounded-[12px] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {success ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl font-serif italic mb-3 text-white">Password Updated!</h2>
            <p className="text-white/50 font-sans text-sm">Redirecting you to sign in...</p>
          </motion.div>
        ) : (
          <>
            <h2 className="text-4xl font-serif italic mb-2 text-center text-white">New Password</h2>
            <p className="text-white/50 font-sans text-center mb-8">Choose a strong password for your account.</p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-sans text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: 'New Password',     value: password,        set: setPassword,         placeholder: '••••••••' },
                { label: 'Confirm Password', value: confirmPassword, set: setConfirmPassword,   placeholder: '••••••••' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label} className="space-y-2">
                  <label className="text-white/70 font-sans text-sm tracking-wide">{label}</label>
                  <input
                    type="password"
                    required
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 rounded-[8px] px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
                    placeholder={placeholder}
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-[8px] bg-white text-black font-sans font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
