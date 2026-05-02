import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { CreditCard, Loader2, TrendingUp, DollarSign, Clock, X, ChevronDown } from 'lucide-react';

const STATUS_STYLES = {
  pending:  'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  paid:     'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  failed:   'bg-red-500/10    border-red-500/20    text-red-400',
  refunded: 'bg-blue-500/10   border-blue-500/20   text-blue-400',
};

function PaymentDetailModal({ payment, onClose }) {
  if (!payment) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-serif italic text-white">Transaction Detail</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Transaction ID',   value: payment.id },
            { label: 'Provider Order',   value: payment.provider_order_id || '—' },
            { label: 'Provider Payment', value: payment.provider_payment_id || '—' },
            { label: 'Client',           value: payment.profiles?.full_name || '—' },
            { label: 'Email',            value: payment.profiles?.email || '—' },
            { label: 'Service',          value: payment.service_type || '—' },
            { label: 'Amount',           value: `$${Number(payment.amount).toLocaleString()} ${payment.currency}` },
            { label: 'Status',           value: payment.status },
            { label: 'Provider',         value: payment.payment_provider },
            { label: 'Created',          value: new Date(payment.created_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) },
            { label: 'Last Updated',     value: new Date(payment.updated_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4 border-b border-white/5 pb-3 last:border-0">
              <span className="text-white/30 font-sans text-xs uppercase tracking-wider shrink-0">{label}</span>
              <span className="text-white font-sans text-sm text-right font-mono break-all">{value}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-3 border border-white/10 text-white/50 rounded-xl font-sans text-sm hover:bg-white/5 transition-colors"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

export default function AdminPayments() {
  const { payments, analytics, loading } = useAdminData();
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = payments.filter(p => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q
      || p.profiles?.full_name?.toLowerCase().includes(q)
      || p.provider_order_id?.toLowerCase().includes(q)
      || p.service_type?.toLowerCase().includes(q)
      || p.profiles?.email?.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  // CSV Export
  const exportCSV = () => {
    const headers = ['Date', 'Client', 'Email', 'Service', 'Amount (USD)', 'Status', 'Provider Order ID', 'Provider Payment ID'];
    const rows = filtered.map(p => [
      new Date(p.created_at).toLocaleDateString('en-US'),
      p.profiles?.full_name || '',
      p.profiles?.email || '',
      p.service_type || '',
      Number(p.amount).toFixed(2),
      p.status,
      p.provider_order_id || '',
      p.provider_payment_id || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revlabs-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">
            Financial <span className="font-serif italic text-white/40">Audit</span>
          </h2>
          <p className="text-white/30 font-sans text-sm mt-1">
            Complete transaction log — all payment events with full details.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 border border-white/10 rounded-xl text-white/60 font-sans text-sm hover:bg-white/5 hover:text-white transition-all"
        >
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue',  value: `$${analytics.totalRevenue.toLocaleString()}`,  icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Monthly',        value: `$${analytics.monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Avg Order Value',value: `$${analytics.avgOrderValue.toLocaleString()}`,  icon: CreditCard, color: 'text-purple-400' },
          { label: 'Pending Value',  value: `$${payments.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.amount), 0).toLocaleString()}`, icon: Clock, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-white/30 font-sans text-[10px] uppercase tracking-widest">{label}</p>
            </div>
            {loading
              ? <div className="h-7 bg-white/5 rounded-lg animate-pulse w-20" />
              : <p className={`text-2xl font-sans font-bold ${color}`}>{value}</p>
            }
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
        <div className="relative w-full md:w-72">
          <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            placeholder="Search client, service, order ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl overflow-x-auto w-full md:w-auto">
          {['all', 'pending', 'paid', 'failed', 'refunded'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg font-sans text-[11px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === s ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {s} {s !== 'all' && `(${payments.filter(p => p.status === s).length})`}
            </button>
          ))}
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
                  {['Client', 'Service', 'Amount', 'Status', 'Date', ''].map(h => (
                    <th key={h} className="text-left py-4 px-5 text-white/20 font-sans text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(payment => (
                  <tr
                    key={payment.id}
                    className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => setSelected(payment)}
                  >
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-serif italic text-white/40 text-sm shrink-0">
                          {payment.profiles?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-white font-sans text-sm font-medium">{payment.profiles?.full_name || '—'}</p>
                          <p className="text-white/30 font-sans text-[11px]">{payment.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 max-w-[200px]">
                      <p className="text-white font-sans text-sm truncate">{payment.service_type || 'Service'}</p>
                      <p className="text-white/20 font-sans text-[10px] font-mono truncate mt-0.5">
                        {payment.provider_order_id?.slice(0, 20)}…
                      </p>
                    </td>
                    <td className="py-5 px-5">
                      <p className="text-white font-sans font-bold">${Number(payment.amount).toLocaleString()}</p>
                      <p className="text-white/30 font-sans text-[10px] uppercase tracking-wider">{payment.currency}</p>
                    </td>
                    <td className="py-5 px-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-sans ${STATUS_STYLES[payment.status] ?? 'bg-white/5 border-white/10 text-white/40'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          payment.status === 'paid' ? 'bg-emerald-400' :
                          payment.status === 'failed' ? 'bg-red-400' :
                          payment.status === 'refunded' ? 'bg-blue-400' : 'bg-yellow-400 animate-pulse'
                        }`} />
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-5 px-5 whitespace-nowrap">
                      <p className="text-white/40 font-sans text-xs">
                        {new Date(payment.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-white/20 font-sans text-[10px] mt-0.5">
                        {new Date(payment.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="py-5 px-5">
                      <ChevronDown className="w-4 h-4 text-white/20 -rotate-90 group-hover:text-white/60 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <PaymentDetailModal payment={selected} onClose={() => setSelected(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
