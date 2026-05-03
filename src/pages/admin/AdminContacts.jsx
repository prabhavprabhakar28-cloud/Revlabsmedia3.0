import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { Mail, Loader2, CheckCircle, Clock, Reply, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const STATUS_STYLES = {
  new:     'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  read:    'bg-white/5       border-white/10       text-white/40',
  replied: 'bg-green-500/10  border-green-500/20   text-green-400',
};

export default function AdminContacts() {
  const { loading } = useAdminData();
  const [submissions, setSubmissions] = useState([]);
  const [fetching, setFetching]       = useState(true);
  const [selected, setSelected]       = useState(null);
  const [updating, setUpdating]       = useState(null);

  // Fetch contact submissions (not in useAdminData, fetched here directly)
  React.useEffect(() => {
    const fetch = async () => {
      setFetching(true);
      const { data } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      setSubmissions(data ?? []);
      setFetching(false);
    };
    fetch();

    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`admin:contacts:${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_submissions' }, fetch)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const markAs = async (id, status) => {
    setUpdating(id);
    await supabase.from('contact_submissions').update({ status }).eq('id', id);
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    setUpdating(null);
  };

  const newCount = submissions.filter(s => s.status === 'new').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">
            Contact <span className="font-serif italic text-white/40">Inbox</span>
          </h2>
          <p className="text-white/40 font-sans text-sm mt-1">
            {newCount > 0 ? `${newCount} new message${newCount > 1 ? 's' : ''} awaiting review.` : 'All messages reviewed.'}
          </p>
        </div>
      </div>

      {fetching ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-32 border border-dashed border-white/10 rounded-2xl">
          <Mail className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/30 font-sans text-lg">No contact submissions yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* List Panel */}
          <div className="lg:col-span-2 space-y-3">
            {submissions.map((sub) => (
              <button
                key={sub.id}
                onClick={() => { setSelected(sub); markAs(sub.id, 'read'); }}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selected?.id === sub.id
                    ? 'bg-white/5 border-white/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/15'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-sans font-semibold text-white text-sm">{sub.name}</p>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[sub.status]}`}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-white/40 font-sans text-xs mb-1">{sub.email}</p>
                <p className="text-white/30 font-sans text-xs line-clamp-2">{sub.message}</p>
                <p className="text-white/20 font-sans text-[10px] mt-3">
                  {new Date(sub.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </button>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-3">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 sticky top-24"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-serif italic text-white">{selected.name}</h3>
                    <a href={`mailto:${selected.email}`} className="text-white/40 font-sans text-sm hover:text-white transition-colors">
                      {selected.email}
                    </a>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-white/30 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-6 mb-6">
                  <p className="text-white/70 font-sans leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`mailto:${selected.email}?subject=Re: Your RevLabs Enquiry`}
                    onClick={() => markAs(selected.id, 'replied')}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-sans font-semibold text-sm hover:bg-white/90 transition-colors"
                  >
                    <Reply className="w-4 h-4" /> Reply via Email
                  </a>
                  {selected.status !== 'read' ? (
                    <button
                      disabled={updating === selected.id}
                      onClick={() => markAs(selected.id, 'read')}
                      className="flex items-center gap-2 px-5 py-3 border border-white/10 text-white/50 rounded-xl font-sans text-sm hover:bg-white/5 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Mark Read
                    </button>
                  ) : null}
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl text-white/20 font-sans text-sm">
                Select a message to read
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
