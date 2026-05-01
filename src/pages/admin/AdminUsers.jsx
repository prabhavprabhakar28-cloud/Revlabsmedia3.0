import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { Users, Loader2, Shield, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers() {
  const { users, loading, updateUserRole } = useAdminData();
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState(null);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">User <span className="font-serif italic text-white/40">Directory</span></h2>
          <p className="text-white/40 font-sans text-sm mt-1">Manage system access and roles for {users.length} members.</p>
        </div>
        
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Users className="h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm font-sans text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-32 bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
          <Users className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/30 font-sans text-lg">No matching users found.</p>
          <button onClick={() => setSearch('')} className="mt-4 text-white/60 hover:text-white text-sm underline underline-offset-4">Clear search</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredUsers.map((profile) => (
            <motion.div
              key={profile.id}
              layout
              className="group bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    <span className="font-serif text-xl italic text-white/40 group-hover:scale-110 transition-transform duration-500">
                      {profile.full_name?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  {profile.role === 'admin' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-lg bg-white border-2 border-black flex items-center justify-center shadow-lg">
                      <Shield className="w-2.5 h-2.5 text-black" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h4 className="text-white font-sans font-medium tracking-tight group-hover:text-white transition-colors">
                      {profile.full_name || 'Unnamed User'}
                    </h4>
                    {profile.id === currentUser?.id && (
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/40 text-[10px] font-sans uppercase tracking-widest font-bold">You</span>
                    )}
                  </div>
                  <p className="text-white/40 font-sans text-sm">{profile.email}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-white/20 font-sans text-[11px] uppercase tracking-wider">
                      Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto pt-4 md:pt-0 border-t border-white/5 md:border-t-0">
                <div className="flex-1 md:flex-none">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-sans font-medium capitalize tracking-wide transition-all ${
                    profile.role === 'admin'
                      ? 'bg-white text-black border-white'
                      : 'bg-white/5 border-white/10 text-white/40'
                  }`}>
                    {profile.role}
                  </span>
                </div>

                <button
                  onClick={() => handleRoleToggle(profile.id, profile.role)}
                  disabled={updating === profile.id || profile.id === currentUser?.id}
                  className={`relative flex items-center justify-center px-5 py-2 rounded-xl font-sans text-[11px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                    profile.id === currentUser?.id
                      ? 'hidden'
                      : profile.role === 'admin'
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        : 'bg-white/5 text-white/60 hover:bg-white hover:text-black hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  }`}
                >
                  {updating === profile.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : profile.role === 'admin' ? (
                    'Revoke Admin'
                  ) : (
                    'Grant Admin'
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
