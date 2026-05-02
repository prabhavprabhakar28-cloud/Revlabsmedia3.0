import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { Users, Loader2, Shield, X, CreditCard, FileText, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function UserDetailPanel({ profile, payments, reports, onClose }) {
  const userPayments = payments.filter(p => p.user_id === profile.id);
  const userReports  = reports.filter(r => r.user_id === profile.id);
  const totalSpent   = userPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-[#080808] border-l border-white/10 flex flex-col overflow-y-auto"
    >
      <div className="p-8 border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-serif italic text-white">User Profile</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatar + Info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
            <span className="font-serif italic text-2xl text-white/60">
              {profile.full_name?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="text-white font-sans font-medium">{profile.full_name || 'Unnamed User'}</p>
            <p className="text-white/40 font-sans text-sm">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest font-sans border ${
                profile.role === 'admin'
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 text-white/40 border-white/10'
              }`}>{profile.role}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Projects', value: userReports.length,  icon: FileText  },
            { label: 'Payments', value: userPayments.length, icon: CreditCard },
            { label: 'Spent',    value: `$${totalSpent.toLocaleString()}`, icon: CreditCard },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-white/30 font-sans text-[10px] uppercase tracking-widest mb-1">{label}</p>
              <p className="text-white font-sans font-bold text-sm">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-8 py-4 border-b border-white/5 space-y-3">
        {[
          { label: 'User ID',     value: profile.id },
          { label: 'Joined',      value: new Date(profile.created_at).toLocaleDateString('en-US', { dateStyle: 'long' }) },
          { label: 'Last Active', value: profile.last_active ? new Date(profile.last_active).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'Never' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-white/30 font-sans text-xs uppercase tracking-wider">{label}</span>
            <span className="text-white/60 font-sans text-xs font-mono break-all text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Payment History */}
      <div className="px-8 py-4 flex-1">
        <h4 className="text-white/40 font-sans text-xs uppercase tracking-widest mb-4">Payment History</h4>
        {userPayments.length === 0 ? (
          <p className="text-white/20 font-sans text-sm">No payments yet.</p>
        ) : (
          <div className="space-y-2">
            {userPayments.map(p => (
              <div key={p.id} className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <div>
                  <p className="text-white font-sans text-sm truncate max-w-[180px]">{p.service_type || 'Payment'}</p>
                  <p className="text-white/30 font-sans text-[10px]">
                    {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-sans font-bold text-sm">${Number(p.amount).toLocaleString()}</p>
                  <span className={`text-[10px] font-bold uppercase font-sans ${
                    p.status === 'paid' ? 'text-emerald-400' : p.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Projects */}
        <h4 className="text-white/40 font-sans text-xs uppercase tracking-widest mb-4 mt-6">Recent Projects</h4>
        {userReports.length === 0 ? (
          <p className="text-white/20 font-sans text-sm">No projects yet.</p>
        ) : (
          <div className="space-y-2">
            {userReports.slice(0, 5).map(r => (
              <div key={r.id} className="flex justify-between items-center p-3 bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-white font-sans text-sm truncate max-w-[200px]">{r.title}</p>
                <span className={`text-[10px] font-bold uppercase font-sans ${
                  r.status === 'completed' ? 'text-emerald-400' :
                  r.status === 'rejected'  ? 'text-red-400' :
                  r.status === 'approved'  ? 'text-blue-400' : 'text-yellow-400'
                }`}>{r.workflow_stage || r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AdminUsers() {
  const { users, reports, payments, loading, updateUserRole } = useAdminData();
  const { user: currentUser } = useAuth();
  const [search,   setSearch]   = useState('');
  const [updating, setUpdating] = useState(null);
  const [selected, setSelected] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchRole   = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleRoleToggle = async (userId, currentRole) => {
    if (userId === currentUser?.id) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole);
    } catch (err) {
      console.error('Failed to update role:', err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-sans font-light text-white tracking-tight">
              User <span className="font-serif italic text-white/40">Directory</span>
            </h2>
            <p className="text-white/30 font-sans text-sm mt-1">
              {users.length} registered members · click any row to view details
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-72">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
              {['all', 'user', 'admin'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-1.5 rounded-lg font-sans text-[11px] font-bold uppercase tracking-widest transition-all ${
                    roleFilter === r ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
            <Users className="w-12 h-12 text-white/5 mx-auto mb-4" />
            <p className="text-white/30 font-sans text-lg">No matching users found.</p>
            <button onClick={() => { setSearch(''); setRoleFilter('all'); }} className="mt-4 text-white/40 hover:text-white text-sm underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-white/[0.02]">
                    {['User', 'Projects', 'Total Spent', 'Joined', 'Role', ''].map(h => (
                      <th key={h} className="text-left py-4 px-5 text-white/20 font-sans text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(profile => {
                    const userPayments = payments.filter(p => p.user_id === profile.id);
                    const userReports  = reports.filter(r => r.user_id === profile.id);
                    const totalSpent   = userPayments.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.amount), 0);

                    return (
                      <tr
                        key={profile.id}
                        className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                        onClick={() => setSelected(profile)}
                      >
                        <td className="py-5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-serif italic text-white/50">
                                {profile.full_name?.[0]?.toUpperCase() || '?'}
                              </div>
                              {profile.role === 'admin' && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-md bg-white border-2 border-black flex items-center justify-center">
                                  <Shield className="w-2 h-2 text-black" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-sans text-sm font-medium">
                                  {profile.full_name || 'Unnamed User'}
                                </p>
                                {profile.id === currentUser?.id && (
                                  <span className="text-[10px] bg-white/10 text-white/40 px-1.5 py-0.5 rounded font-sans">You</span>
                                )}
                              </div>
                              <p className="text-white/30 font-sans text-xs">{profile.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 px-5">
                          <p className="text-white font-sans text-sm">{userReports.length}</p>
                        </td>
                        <td className="py-5 px-5">
                          <p className="text-white font-sans font-bold text-sm">${totalSpent.toLocaleString()}</p>
                        </td>
                        <td className="py-5 px-5 whitespace-nowrap">
                          <p className="text-white/40 font-sans text-xs">
                            {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </td>
                        <td className="py-5 px-5">
                          <button
                            onClick={e => { e.stopPropagation(); handleRoleToggle(profile.id, profile.role); }}
                            disabled={updating === profile.id || profile.id === currentUser?.id}
                            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-sans font-medium capitalize tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                              profile.role === 'admin'
                                ? 'bg-white text-black border-white hover:bg-white/90'
                                : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                            }`}
                          >
                            {updating === profile.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            {profile.role}
                          </button>
                        </td>
                        <td className="py-5 px-5">
                          <ChevronDown className="w-4 h-4 text-white/20 -rotate-90 group-hover:text-white/60 transition-colors" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* Slide-in User Detail Panel */}
      <AnimatePresence>
        {selected && (
          <UserDetailPanel
            profile={selected}
            payments={payments}
            reports={reports}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
