import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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

export default function Signup() {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');
  const [loading, setLoading]         = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 8)           return setError('Password must be at least 8 characters.');
    if (password !== confirmPassword)  return setError('Passwords do not match.');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName  = name.trim();

    setLoading(true);
    try {
      await signup(normalizedName, normalizedEmail, password);
      navigate('/welcome');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(err.message);
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
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <h2 className="text-4xl font-serif italic mb-2 text-center text-white">Create Account</h2>
        <p className="text-white/50 font-sans text-center mb-8">Join RevLabs to scale your visuals.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-[8px] text-red-400 font-sans text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-[8px] text-green-400 font-sans text-sm text-center">
            {success}
          </div>
        )}

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 mb-6 rounded-[8px] bg-white text-[#1a1a1a] font-sans font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GoogleIcon />
          {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-white/30 font-sans text-xs">or</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: 'Full Name', type: 'text',     value: name,            set: setName,            placeholder: 'John Doe',            maxLen: 100 },
            { label: 'Email',     type: 'email',    value: email,           set: setEmail,           placeholder: 'hello@revlabs.online',   maxLen: 254 },
            { label: 'Password',  type: 'password', value: password,        set: setPassword,        placeholder: '••••••••', maxLen: 128 },
            { label: 'Confirm',   type: 'password', value: confirmPassword, set: setConfirmPassword, placeholder: '••••••••', maxLen: 128 },
          ].map(({ label, type, value, set, placeholder, maxLen }) => (
            <div key={label} className="space-y-2">
              <label className="text-white/70 font-sans text-sm tracking-wide">{label}</label>
              <input
                type={type}
                required
                value={value}
                onChange={(e) => set(e.target.value)}
                maxLength={maxLen}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-[8px] px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
                placeholder={placeholder}
              />
            </div>
          ))}

          <Button type="submit" className="w-full text-center py-4 rounded-[8px] mt-4" disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>

        <p className="mt-8 text-center text-white/50 font-sans text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-white hover:underline transition-all">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
