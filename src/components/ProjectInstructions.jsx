import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare, Send, Loader2, CheckCircle,
  Clock, Shield, ChevronDown,
} from 'lucide-react';

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function ProjectInstructions({ reportId }) {
  const { user, isAdmin } = useAuth();
  const [instructions, setInstructions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [content, setContent]           = useState('');
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [error, setError]               = useState('');
  const [showHistory, setShowHistory]   = useState(false);

  // ── Fetch instructions ────────────────────────────────────────
  const fetchInstructions = useCallback(async () => {
    if (!reportId) return;
    setLoading(true);
    const { data } = await supabase
      .from('project_instructions')
      .select('*, profiles(full_name, role)')
      .eq('report_id', reportId)
      .order('created_at', { ascending: true });
    setInstructions(data ?? []);
    setLoading(false);
  }, [reportId]);

  useEffect(() => {
    fetchInstructions();

    // Real-time updates
    const channel = supabase
      .channel(`instructions:${reportId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'project_instructions', filter: `report_id=eq.${reportId}` },
        fetchInstructions
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [reportId, fetchInstructions]);

  // ── Submit / Update ───────────────────────────────────────────
  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    setError('');

    try {
      // Version = count of client instructions + 1
      const clientInstructions = instructions.filter(i => !i.is_admin_reply);
      const version = clientInstructions.length + 1;

      const { error: insertError } = await supabase
        .from('project_instructions')
        .insert({
          report_id:     reportId,
          user_id:       user.id,
          content:       content.trim(),
          version,
          is_admin_reply: false,
        });

      if (insertError) throw insertError;

      setContent('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const clientInstructions = instructions.filter(i => !i.is_admin_reply);
  const adminReplies        = instructions.filter(i => i.is_admin_reply);
  const latestInstruction   = clientInstructions[clientInstructions.length - 1];

  return (
    <div className="space-y-6">

      {/* Admin Replies (always visible at top) */}
      {adminReplies.map(reply => (
        <motion.div
          key={reply.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-white border-2 border-black flex items-center justify-center shrink-0 mt-0.5">
            <Shield className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-none p-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white font-sans text-xs font-bold">RevLabs Team</p>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <p className="text-white/30 font-sans text-[10px]">{formatRelativeTime(reply.created_at)}</p>
            </div>
            <p className="text-white/80 font-sans text-sm leading-relaxed whitespace-pre-wrap">
              {reply.content}
            </p>
          </div>
        </motion.div>
      ))}

      {/* Latest Client Instruction */}
      {latestInstruction && (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-white/40" />
              <p className="text-white/60 font-sans text-xs uppercase tracking-widest">
                Current Instructions
              </p>
              <span className="px-2 py-0.5 rounded-md bg-white/5 text-white/30 font-sans text-[10px]">
                v{latestInstruction.version}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-white/20">
              <Clock className="w-3 h-3" />
              <span className="font-sans text-[10px]">{formatRelativeTime(latestInstruction.created_at)}</span>
            </div>
          </div>
          <p className="text-white/80 font-sans text-sm leading-relaxed whitespace-pre-wrap">
            {latestInstruction.content}
          </p>
        </div>
      )}

      {/* Version History Toggle */}
      {clientInstructions.length > 1 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-white/30 font-sans text-xs hover:text-white/60 transition-colors"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            {showHistory ? 'Hide' : 'Show'} version history ({clientInstructions.length - 1} previous)
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3 space-y-2"
              >
                {clientInstructions.slice(0, -1).reverse().map(inst => (
                  <div key={inst.id} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-mono text-white/30">v{inst.version}</span>
                      <span className="text-white/20 font-sans text-[10px]">{formatRelativeTime(inst.created_at)}</span>
                    </div>
                    <p className="text-white/50 font-sans text-sm leading-relaxed line-clamp-3 whitespace-pre-wrap">
                      {inst.content}
                    </p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Update Instructions */}
      {!isAdmin && (
        <div className="space-y-3">
          <label className="text-white/30 font-sans text-xs uppercase tracking-widest">
            {clientInstructions.length === 0 ? 'Add Instructions' : 'Update Instructions'}
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Describe your preferences, style references, specific requirements, deadlines, do's and don'ts..."
            className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-white/30 transition-colors resize-none placeholder:text-white/20 leading-relaxed"
          />
          {error && (
            <p className="text-red-400 font-sans text-sm">{error}</p>
          )}
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 font-sans text-sm">
              <CheckCircle className="w-4 h-4" />
              Instructions saved!
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black font-sans font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {saving ? 'Saving…' : clientInstructions.length === 0 ? 'Add Instructions' : 'Update Instructions'}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
        </div>
      )}
    </div>
  );
}
