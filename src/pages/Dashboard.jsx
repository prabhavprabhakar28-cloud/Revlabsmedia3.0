import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../hooks/useReports';
import { usePayments } from '../hooks/usePayments';
import { supabase } from '../lib/supabase';
import ScheduleMeeting from '../components/ScheduleMeeting';
import {
  User, FileText, CreditCard, Plus, X, LogOut,
  Clock, CheckCircle, XCircle, Package, Loader2,
  AlertCircle, ChevronRight, Download, Sparkles,
  ArrowRight, Save, Pencil, Calendar, Upload,
  Bell, TrendingUp,
} from 'lucide-react';

const STATUS_STYLES = {
  pending:              'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  approved:             'bg-blue-500/10   border-blue-500/20   text-blue-400',
  in_editing:           'bg-purple-500/10 border-purple-500/20 text-purple-400',
  review:               'bg-cyan-500/10   border-cyan-500/20   text-cyan-400',
  revision_requested:   'bg-orange-500/10 border-orange-500/20 text-orange-400',
  final_delivery:       'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  completed:            'bg-green-500/10  border-green-500/20  text-green-400',
  rejected:             'bg-red-500/10    border-red-500/20    text-red-400',
  paid:                 'bg-green-500/10  border-green-500/20  text-green-400',
  failed:               'bg-red-500/10    border-red-500/20    text-red-400',
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-sans font-bold uppercase tracking-wider ${STATUS_STYLES[status] ?? 'bg-white/5 border-white/10 text-white/50'}`}>
    {status?.replace(/_/g, ' ')}
  </span>
);

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

function downloadInvoice(payment, userProfile) {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>RevLabs Invoice</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',sans-serif;background:#000;color:#fff;padding:60px;max-width:700px;margin:0 auto}.logo{font-size:32px;font-weight:300;letter-spacing:8px;text-transform:uppercase;margin-bottom:60px}.row{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px}.label{color:#666;text-transform:uppercase;letter-spacing:2px;font-size:10px}.divider{border:none;border-top:1px solid #222;margin:40px 0}.amount{font-size:48px;font-weight:300}</style>
  </head><body>
  <div class="logo">Rev<span style="font-style:italic">Labs</span></div>
  <h2 style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#444;margin-bottom:20px">Invoice</h2>
  <div class="amount">$${Number(payment.amount).toLocaleString()}</div>
  <hr class="divider"/>
  <div class="row"><span class="label">Invoice ID</span><span>#${escapeHtml(payment.id.slice(0,8).toUpperCase())}</span></div>
  <div class="row"><span class="label">Date</span><span>${new Date(payment.created_at).toLocaleDateString('en-US',{dateStyle:'long'})}</span></div>
  <div class="row"><span class="label">Client</span><span>${escapeHtml(userProfile?.full_name||'Client')}</span></div>
  <div class="row"><span class="label">Service</span><span>${escapeHtml(payment.service_type||'RevLabs Service')}</span></div>
  <div class="row"><span class="label">Transaction ID</span><span>${escapeHtml(payment.provider_payment_id||'—')}</span></div>
  <div class="row"><span class="label">Status</span><span style="color:#4ade80">${escapeHtml(payment.status)}</span></div>
  <hr class="divider"/>
  <p style="font-size:11px;color:#333">RevLabs Media · hello@revlabs.online · revlabs.online</p>
  </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `revlabs-invoice-${payment.id.slice(0,8)}.html`; a.click();
  URL.revokeObjectURL(url);
}

function NewReportModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try { await onCreate({ title, description }); onClose(); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif italic text-white">New Project Request</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-sans text-sm flex gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-white/40 font-sans text-xs uppercase tracking-widest">Project Title</label>
            <input type="text" required value={title} onChange={e=>setTitle(e.target.value)} maxLength={200}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
              placeholder="e.g. YouTube Channel Re-edit"/>
          </div>
          <div className="space-y-2">
            <label className="text-white/40 font-sans text-xs uppercase tracking-widest">Brief / Description</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} maxLength={2000}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors resize-none"
              placeholder="Describe your requirements, style references, deadlines..."/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-white text-black font-sans font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Sparkles className="w-4 h-4"/>Submit Request</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ProfileEditForm({ profile, user, updateProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await updateProfile({ full_name: name }); setSaved(true); setEditing(false); setTimeout(()=>setSaved(false),3000); }
    catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 max-w-lg">
      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8">
        <span className="text-2xl font-serif italic text-white/70">{(name||user?.email)?.[0]?.toUpperCase()||'?'}</span>
      </div>
      {saved && <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 font-sans text-sm flex gap-2"><CheckCircle className="w-4 h-4 shrink-0 mt-0.5"/>Profile updated.</div>}
      <form onSubmit={handleSave} className="space-y-5">
        <div className="space-y-2">
          <label className="text-white/30 font-sans text-[10px] uppercase tracking-widest">Full Name</label>
          {editing ? <input value={name} onChange={e=>setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30"/>
            : <p className="text-white font-sans">{profile?.full_name||'—'}</p>}
        </div>
        {[{label:'Email',value:profile?.email||user?.email},{label:'Role',value:profile?.role},{label:'Member Since',value:profile?.created_at?new Date(profile.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'}):'—'}].map(({label,value})=>(
          <div key={label} className="border-t border-white/5 pt-4">
            <p className="text-white/30 font-sans text-[10px] uppercase tracking-widest mb-1">{label}</p>
            <p className="text-white font-sans capitalize">{value||'—'}</p>
          </div>
        ))}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          {editing ? <>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-white text-black rounded-xl font-sans font-semibold text-sm hover:bg-white/90 disabled:opacity-50">
              {saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}{saving?'Saving...':'Save'}
            </button>
            <button type="button" onClick={()=>setEditing(false)} className="px-6 py-2.5 border border-white/10 text-white/50 rounded-xl font-sans text-sm hover:bg-white/5">Cancel</button>
          </> : (
            <button type="button" onClick={()=>setEditing(true)} className="flex items-center gap-2 px-6 py-2.5 border border-white/10 text-white/60 rounded-xl font-sans text-sm hover:bg-white/5 hover:text-white">
              <Pencil className="w-4 h-4"/>Edit Profile
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile, logout, updateProfile } = useAuth();
  const { reports, loading: rLoading, createReport } = useReports();
  const { payments, loading: pLoading } = usePayments();
  const [tab, setTab] = useState('projects');
  const [showModal, setShowModal] = useState(false);
  const [meetings, setMeetings] = useState([]);

  // Fetch user meetings
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('meetings').select('*').eq('user_id', user.id).order('scheduled_at', { ascending: true });
      setMeetings(data ?? []);
    };
    fetch();
    const ch = supabase.channel(`dash:meetings:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings', filter: `user_id=eq.${user.id}` }, fetch)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);

  const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);
  const activeProjects = reports.filter(r => !['completed','rejected','cancelled'].includes(r.workflow_stage || r.status)).length;

  const tabs = [
    { id: 'projects',  label: 'Projects',  icon: FileText,  count: reports.length },
    { id: 'payments',  label: 'Payments',  icon: CreditCard, count: payments.length },
    { id: 'meetings',  label: 'Meetings',  icon: Calendar,  count: meetings.filter(m => m.status !== 'cancelled').length },
    { id: 'profile',   label: 'Profile',   icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-28 pb-20 px-6">
      <AnimatePresence>
        {showModal && <NewReportModal onClose={() => setShowModal(false)} onCreate={createReport} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-2">Client Dashboard</p>
            <h1 className="text-4xl md:text-5xl font-sans font-light">
              Hey, <span className="font-serif italic">{profile?.full_name?.split(' ')[0] || 'there'}</span> 👋
            </h1>
          </div>
          <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/40 font-sans text-sm hover:text-white hover:border-white/20 transition-colors w-fit">
            <LogOut className="w-4 h-4"/>Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Projects', value: reports.length },
            { label: 'Active',         value: activeProjects },
            { label: 'Total Payments', value: payments.length },
            { label: 'Amount Paid',    value: `$${totalPaid.toLocaleString('en-US')}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
              <p className="text-white/30 font-sans text-[10px] uppercase tracking-widest mb-2">{label}</p>
              <p className="text-2xl font-sans font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-white/5 pb-px overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 font-sans text-xs sm:text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${tab === id ? 'border-white text-white' : 'border-transparent text-white/30 hover:text-white/70'}`}>
              <Icon className="w-4 h-4"/>
              {label}
              {count !== undefined && <span className="text-xs bg-white/8 px-1.5 py-0.5 rounded-full">{count}</span>}
            </button>
          ))}
        </div>

        {/* ── Projects Tab ── */}
        {tab === 'projects' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="projects">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-sans font-light text-white/70">Your Projects</h2>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-sans font-semibold text-sm hover:bg-white/90 transition-colors">
                <Plus className="w-4 h-4"/>New Request
              </button>
            </div>
            {rLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-white/20 animate-spin"/></div>
            ) : reports.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-white/20"/>
                </div>
                <h3 className="text-2xl font-serif italic text-white mb-3">Start Your First Project</h3>
                <p className="text-white/30 font-sans max-w-xs mx-auto mb-8 leading-relaxed">Submit a project brief and our creative team will take it from there.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => setShowModal(true)} className="px-8 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors flex items-center gap-2 mx-auto sm:mx-0">
                    <Plus className="w-4 h-4"/>Submit a Brief
                  </button>
                  <Link to="/services" className="px-8 py-3 border border-white/10 text-white/60 rounded-full font-sans hover:bg-white/5 transition-colors flex items-center gap-2 mx-auto sm:mx-0">
                    Browse Services<ArrowRight className="w-4 h-4"/>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <motion.div key={report.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    <Link to={`/dashboard/report/${report.id}`}
                      className="block bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 group">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <StatusBadge status={report.workflow_stage || report.status} />
                          <span className="text-white/20 font-sans text-xs font-mono">#{report.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="text-lg font-sans font-medium text-white">{report.title}</h3>
                        {report.description && <p className="text-white/30 font-sans text-sm line-clamp-1">{report.description}</p>}
                        <p className="text-white/20 font-sans text-xs">{new Date(report.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}</p>
                      </div>
                      <div className="flex items-center gap-2 text-white/30 group-hover:text-white/60 transition-colors shrink-0">
                        <span className="font-sans text-xs">View Details</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Payments Tab ── */}
        {tab === 'payments' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="payments">
            <h2 className="text-xl font-sans font-light text-white/70 mb-6">Payment History</h2>
            {pLoading ? <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-white/20 animate-spin"/></div>
            : payments.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                <div className="w-20 h-20 bg-white/[0.03] border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CreditCard className="w-10 h-10 text-white/20"/>
                </div>
                <h3 className="text-2xl font-serif italic text-white mb-3">No Payments Yet</h3>
                <p className="text-white/30 font-sans max-w-xs mx-auto mb-8">Choose a plan and complete a payment to see history here.</p>
                <Link to="/services" className="px-8 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors inline-flex items-center gap-2">
                  View Plans<ArrowRight className="w-4 h-4"/>
                </Link>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <motion.div key={payment.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge status={payment.status}/>
                        <span className="text-white/20 font-sans text-xs capitalize">{payment.payment_provider}</span>
                      </div>
                      <h3 className="text-lg font-sans font-medium text-white">{payment.service_type || 'Service Payment'}</h3>
                      <p className="text-white/20 font-sans text-xs">{new Date(payment.created_at).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-sans font-semibold text-white">${Number(payment.amount).toLocaleString('en-US')}</p>
                        <p className="text-[10px] text-white/30 uppercase tracking-widest">{payment.currency}</p>
                      </div>
                      {payment.status === 'paid' && (
                        <button onClick={() => downloadInvoice(payment, profile)} title="Download Invoice"
                          className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all">
                          <Download className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Meetings Tab ── */}
        {tab === 'meetings' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="meetings">
            <h2 className="text-xl font-sans font-light text-white/70 mb-6">Schedule a Meeting</h2>
            <ScheduleMeeting existingMeetings={meetings} />
          </motion.div>
        )}

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key="profile">
            <h2 className="text-xl font-sans font-light text-white/70 mb-6">Your Profile</h2>
            <ProfileEditForm profile={profile} user={user} updateProfile={updateProfile} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
