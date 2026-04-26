import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { FileText, Loader2, ChevronDown } from 'lucide-react';
import { sendEmail } from '../../lib/email';

const STATUSES = ['pending', 'approved', 'rejected', 'completed'];

const STATUS_STYLES = {
  pending:   'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  approved:  'bg-blue-500/10   border-blue-500/20   text-blue-400',
  rejected:  'bg-red-500/10    border-red-500/20    text-red-400',
  completed: 'bg-green-500/10  border-green-500/20  text-green-400',
};

export default function AdminReports() {
  const { reports, loading, updateReportStatus } = useAdminData();
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');

  const filtered = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                         r.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStatusChange = async (id, newStatus, report) => {
    setUpdating(id);
    try {
      await updateReportStatus(id, newStatus);
      // Fire status-change email for meaningful transitions
      if (['approved', 'completed', 'rejected'].includes(newStatus) && report?.profiles?.email) {
        await sendEmail({
          type: 'status_update',
          to:   report.profiles.email,
          name: report.profiles.full_name || 'there',
          data: { title: report.title, status: newStatus },
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err.message);
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">Workflow <span className="font-serif italic text-white/40">Queue</span></h2>
          <p className="text-white/40 font-sans text-sm mt-1">Review and manage project submission statuses.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FileText className="h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-sm font-sans text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>

          <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl w-full md:w-auto overflow-x-auto">
            {['all', ...STATUSES].map((s) => (
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
          <FileText className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/30 font-sans text-lg">No reports found in this view.</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/[0.02]">
                  {['User Info', 'Report Content', 'Status', 'Date', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-5 px-6 text-white/20 font-sans text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((report) => (
                  <tr
                    key={report.id}
                    className="group hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-serif italic text-white/40">
                          {report.profiles?.full_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-white font-sans text-sm font-medium">{report.profiles?.full_name || '—'}</p>
                          <p className="text-white/30 font-sans text-[11px]">{report.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6 max-w-xs">
                      <p className="text-white font-sans text-sm font-medium truncate">{report.title}</p>
                      {report.description && (
                        <p className="text-white/30 font-sans text-xs line-clamp-1 mt-0.5">{report.description}</p>
                      )}
                    </td>
                    <td className="py-6 px-6">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-[10px] font-sans font-bold uppercase tracking-wider ${STATUS_STYLES[report.status]}`}>
                        <div className={`w-1 h-1 rounded-full mr-2 ${
                          report.status === 'completed' ? 'bg-green-400' : 
                          report.status === 'rejected' ? 'bg-red-400' : 
                          report.status === 'approved' ? 'bg-blue-400' : 'bg-yellow-400'
                        }`} />
                        {report.status}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <p className="text-white/40 font-sans text-xs">
                        {new Date(report.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </td>
                    <td className="py-6 px-6">
                      <div className="relative inline-block w-full">
                        <select
                          value={report.status}
                          disabled={updating === report.id}
                          onChange={(e) => handleStatusChange(report.id, e.target.value, report)}
                          className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-white font-sans text-xs cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-50"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-black text-white">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-white/30">
                          {updating === report.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
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
