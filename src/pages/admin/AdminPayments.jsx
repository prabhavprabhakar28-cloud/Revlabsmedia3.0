import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { CreditCard, Loader2 } from 'lucide-react';

const STATUS_STYLES = {
  pending:  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  paid:     'bg-green-500/10  border-green-500/20  text-green-400',
  failed:   'bg-red-500/10    border-red-500/20    text-red-400',
  refunded: 'bg-blue-500/10   border-blue-500/20   text-blue-400',
};

export default function AdminPayments() {
  const { payments, loading } = useAdminData();
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]     = useState('');

  const filtered = payments.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = p.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                         p.provider_order_id?.toLowerCase().includes(search.toLowerCase()) ||
                         p.service_type?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">Financial <span className="font-serif italic text-white/40">Audit</span></h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-white/40 font-sans text-sm">Total revenue:</span>
            <span className="text-emerald-400 font-sans font-bold text-sm tracking-wide">${totalRevenue.toLocaleString('en-US')}</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <CreditCard className="h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl w-full md:w-auto overflow-x-auto">
            {['all', 'pending', 'paid', 'failed', 'refunded'].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-1.5 rounded-lg font-sans text-[11px] font-bold uppercase tracking-widest transition-all ${
                  filter === s
                    ? 'bg-white text-black shadow-lg'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                {s}
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
          <CreditCard className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/30 font-sans text-lg">No transactions found.</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['Client Info', 'Service Details', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="text-left py-5 px-6 text-white/20 font-sans text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((payment) => (
                  <tr
                    key={payment.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-serif italic text-white/40">
                          {payment.profiles?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-white font-sans text-sm font-medium">{payment.profiles?.full_name || '—'}</p>
                          <p className="text-white/30 font-sans text-[11px]">{payment.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 max-w-xs">
                      <p className="text-white font-sans text-sm font-medium truncate">{payment.service_type || 'Custom Project'}</p>
                      <p className="text-white/20 font-sans text-[10px] tracking-tight truncate mt-0.5">{payment.provider_order_id}</p>
                    </td>
                    <td className="py-6 px-6">
                      <p className="text-white font-sans font-bold text-sm tracking-tight">${Number(payment.amount).toLocaleString('en-US')}</p>
                      <p className="text-white/30 font-sans text-[10px] uppercase tracking-widest">{payment.currency}</p>
                    </td>
                    <td className="py-6 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-sans font-bold uppercase tracking-wider ${STATUS_STYLES[payment.status] ?? 'bg-white/5 border-white/10 text-white/40'}`}>
                        <div className={`w-1 h-1 rounded-full mr-2 ${
                          payment.status === 'paid' ? 'bg-emerald-400' : 
                          payment.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                        }`} />
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-6 px-6 whitespace-nowrap">
                      <p className="text-white/40 font-sans text-xs">
                        {new Date(payment.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
