import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../components/Button';
import { useSEO } from '../hooks/useSEO';
import { sendEmail } from '../lib/email';

export default function Contact() {
  useSEO({ title: 'Get in Touch', description: 'Contact RevLabs Media House. Whether it\'s a global campaign or a creative short — let\'s build something epic.', canonical: '/contact' });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus]     = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([
          { 
            name:    formData.name, 
            email:   formData.email, 
            message: formData.message 
          }
        ]);

      if (error) throw error;

      // Silently notify admin about new contact submission
      await sendEmail({
        type: 'report_submitted',
        to: 'hello@revlabs.com',
        name: 'Admin',
        data: { title: `New contact from ${formData.name} (${formData.email}): ${formData.message.slice(0, 80)}` },
      });

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact error:', err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-32 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
        
        {/* Left Column: Text Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-white/40 font-sans text-sm uppercase tracking-widest mb-4">Get in Touch</p>
          <h1 className="text-6xl md:text-8xl font-sans font-light mb-8 leading-none">
            Let's <span className="font-serif italic lowercase normal-case">Create</span> Something <span className="font-serif italic lowercase normal-case">Epic</span>.
          </h1>
          <p className="text-xl text-white/60 font-sans max-w-md leading-relaxed mb-12">
            Ready to transform your visual content? Whether it's a global campaign or a creative short, we're here to help you scale.
          </p>

          <div className="space-y-6">
            <div>
              <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-2">Email Us</p>
              <a href="mailto:hello@revlabs.com" className="text-2xl font-serif italic hover:text-white/80 transition-colors">hello@revlabs.com</a>
            </div>
            <div>
              <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-2">Based</p>
              <p className="text-lg font-sans text-white/80">Worldwide &middot; Operating 24/7</p>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/[0.02] border border-white/10 rounded-[20px] p-8 md:p-12 relative overflow-hidden"
        >
          {/* Subtle glow effect */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-white/[0.02] blur-[100px] pointer-events-none" />

          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-20"
              >
                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h2 className="text-3xl font-serif italic text-white mb-4">Message Sent!</h2>
                <p className="text-white/50 font-sans mb-8">We've received your request and will get back to you shortly.</p>
                <button 
                  onClick={() => setStatus('idle')}
                  className="px-8 py-3 border border-white/10 rounded-full font-sans text-sm hover:bg-white/5 transition-colors"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 relative z-10"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-white/60 font-sans text-xs uppercase tracking-widest pl-1">Name</label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[12px] px-5 py-4 text-white font-sans focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-white/60 font-sans text-xs uppercase tracking-widest pl-1">Email</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="hello@example.com"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-[12px] px-5 py-4 text-white font-sans focus:outline-none focus:border-white/30 transition-all placeholder:text-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-white/60 font-sans text-xs uppercase tracking-widest pl-1">Message</label>
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us about your project..."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-[12px] px-5 py-4 text-white font-sans focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-white/10"
                  />
                </div>

                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-[10px] text-red-400 font-sans text-sm flex gap-3"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {errorMsg}
                  </motion.div>
                )}

                <Button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-5 rounded-[12px] flex items-center justify-center gap-3 group"
                >
                  {status === 'loading' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
