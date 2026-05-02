import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { Loader2, ChevronRight, CreditCard, Calendar, User } from 'lucide-react';

// ── Workflow stages in order ──────────────────────────────────
const STAGES = [
  { id: 'pending',             label: 'Pending',          color: 'border-yellow-500/30  bg-yellow-500/5',  dot: 'bg-yellow-400' },
  { id: 'approved',            label: 'Approved',         color: 'border-blue-500/30    bg-blue-500/5',    dot: 'bg-blue-400' },
  { id: 'in_editing',          label: 'In Editing',       color: 'border-purple-500/30  bg-purple-500/5',  dot: 'bg-purple-400' },
  { id: 'review',              label: 'Review',           color: 'border-cyan-500/30    bg-cyan-500/5',    dot: 'bg-cyan-400' },
  { id: 'revision_requested',  label: 'Revision',         color: 'border-orange-500/30  bg-orange-500/5',  dot: 'bg-orange-400' },
  { id: 'final_delivery',      label: 'Final Delivery',   color: 'border-indigo-500/30  bg-indigo-500/5',  dot: 'bg-indigo-400' },
  { id: 'completed',           label: 'Completed',        color: 'border-emerald-500/30 bg-emerald-500/5', dot: 'bg-emerald-400' },
];

function ProjectCard({ report, onDragStart }) {
  const stage = report.workflow_stage || report.status || 'pending';
  const stageConfig = STAGES.find(s => s.id === stage) || STAGES[0];
  const paymentStatus = report.payment_id ? 'linked' : null;

  return (
    <motion.div
      layout
      draggable
      onDragStart={(e) => onDragStart(e, report.id)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-black border border-white/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all duration-200 select-none group"
    >
      {/* Client info */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
          <span className="text-[10px] font-serif italic text-white/60">
            {report.profiles?.full_name?.[0] || '?'}
          </span>
        </div>
        <p className="text-white/40 font-sans text-[11px] truncate">{report.profiles?.full_name || 'Unknown'}</p>
      </div>

      {/* Title */}
      <h4 className="text-white font-sans text-sm font-medium leading-snug mb-3 line-clamp-2">
        {report.title}
      </h4>

      {/* Metadata row */}
      <div className="flex items-center gap-2 flex-wrap">
        {report.service_type && (
          <span className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-white/5 text-white/30 truncate max-w-[120px]">
            {report.service_type}
          </span>
        )}
        {report.deadline && (
          <span className="flex items-center gap-1 text-[10px] font-sans text-white/30">
            <Calendar className="w-3 h-3" />
            {new Date(report.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        {report.assigned_to && (
          <span className="flex items-center gap-1 text-[10px] font-sans text-white/30">
            <User className="w-3 h-3" />
            {report.assigned_to}
          </span>
        )}
      </div>

      {/* ID */}
      <p className="text-[10px] font-mono text-white/15 mt-2">#{report.id.slice(0, 8)}</p>
    </motion.div>
  );
}

function KanbanColumn({ stage, reports, onDragOver, onDrop, updating }) {
  const count = reports.length;
  return (
    <div
      className="flex-1 min-w-[200px] max-w-[280px]"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.dot}`} />
          <span className="font-sans text-xs font-semibold uppercase tracking-widest text-white/60">
            {stage.label}
          </span>
        </div>
        <span className="font-sans text-xs text-white/30 font-bold">{count}</span>
      </div>

      {/* Cards drop zone */}
      <div
        className={`min-h-[120px] rounded-xl border-2 border-dashed p-3 transition-all duration-200 space-y-3 ${
          stage.color
        } ${updating ? 'opacity-50' : ''}`}
      >
        {reports.map(r => (
          <ProjectCard
            key={r.id}
            report={r}
            onDragStart={(e, id) => e.dataTransfer.setData('reportId', id)}
          />
        ))}
        {count === 0 && (
          <div className="flex items-center justify-center h-16">
            <p className="text-white/15 font-sans text-xs">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminWorkflow() {
  const { reports, loading, updateReportStatus } = useAdminData();
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredReports = filter
    ? reports.filter(r =>
        r.title?.toLowerCase().includes(filter.toLowerCase()) ||
        r.profiles?.full_name?.toLowerCase().includes(filter.toLowerCase())
      )
    : reports;

  // Group reports by workflow_stage
  const grouped = STAGES.reduce((acc, stage) => {
    acc[stage.id] = filteredReports.filter(r =>
      (r.workflow_stage || r.status) === stage.id
    );
    return acc;
  }, {});

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    const reportId = e.dataTransfer.getData('reportId');
    if (!reportId) return;

    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const currentStage = report.workflow_stage || report.status;
    if (currentStage === targetStage) return;

    setUpdating(true);
    try {
      // Map workflow_stage to compatible status for DB
      const statusMap = {
        pending:            'pending',
        approved:           'approved',
        in_editing:         'approved',
        review:             'approved',
        revision_requested: 'approved',
        final_delivery:     'approved',
        completed:          'completed',
        cancelled:          'rejected',
      };
      await updateReportStatus(reportId, statusMap[targetStage] || targetStage, targetStage);
    } catch (err) {
      console.error('Failed to update stage:', err.message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">
            Project <span className="font-serif italic text-white/40">Workflow</span>
          </h2>
          <p className="text-white/30 font-sans text-sm mt-1">
            Drag and drop projects between stages.
          </p>
        </div>
        <input
          type="text"
          placeholder="Filter projects..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-white/[0.03] border border-white/10 rounded-xl py-2.5 px-4 text-sm font-sans text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 w-64"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Loader2 className="w-8 h-8 text-white/10 animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STAGES.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                reports={grouped[stage.id] || []}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                updating={updating}
              />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-8 flex flex-wrap gap-3">
        {STAGES.map(s => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className="text-white/30 font-sans text-[11px]">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
