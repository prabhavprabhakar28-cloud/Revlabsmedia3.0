import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Package, Loader2,
  FileText, CalendarDays, Hash, AlertCircle,
} from 'lucide-react';

// ── Status Config ─────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    desc: 'Your report has been received and is awaiting review from our team.',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    desc: 'Your project has been approved. Our team will be in touch shortly.',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    desc: 'Unfortunately, your report could not be approved at this time. Please contact us for more details.',
  },
  completed: {
    label: 'Completed',
    icon: Package,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    desc: 'Your project has been completed and delivered. Thank you for working with RevLabs!',
  },
};

// ── Progress Timeline ─────────────────────────────────────────
const TIMELINE_STEPS = ['pending', 'approved', 'completed'];

function StatusTimeline({ currentStatus }) {
  if (currentStatus === 'rejected') {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
        <p className="font-sans text-sm text-red-400">This project request was not approved.</p>
      </div>
    );
  }

  const currentIndex = TIMELINE_STEPS.indexOf(currentStatus);

  return (
    <div className="relative">
      {/* Connector Line */}
      <div className="absolute top-5 left-5 right-5 h-px bg-white/5" />
      <div
        className="absolute top-5 left-5 h-px bg-white/30 transition-all duration-700"
        style={{ width: `${(currentIndex / (TIMELINE_STEPS.length - 1)) * (100 - 10)}%` }}
      />

      <div className="relative flex justify-between">
        {TIMELINE_STEPS.map((step, i) => {
          const config = STATUS_CONFIG[step];
          const Icon = config.icon;
          const isCompleted = i <= currentIndex;
          return (
            <div key={step} className="flex flex-col items-center gap-3 flex-1">
              <div
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                  isCompleted
                    ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                    : 'bg-transparent border-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCompleted ? 'text-black' : 'text-white/20'}`} />
              </div>
              <div className="text-center">
                <p className={`font-sans text-xs font-semibold uppercase tracking-widest ${isCompleted ? 'text-white' : 'text-white/20'}`}>
                  {step}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error: err } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id) // Security: only fetch own reports
        .single();

      if (err || !data) {
        setError('Report not found or you do not have access to it.');
      } else {
        setReport(data);
      }
      setLoading(false);
    };

    fetchReport();

    // Real-time updates so the user sees status changes live
    const channel = supabase
      .channel(`report:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${id}` },
        (payload) => setReport(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-serif italic mb-3">Report Not Found</h2>
          <p className="text-white/40 font-sans mb-8">{error}</p>
          <Link to="/dashboard" className="px-6 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90 transition-colors">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const config = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = config.icon;
  const createdDate = new Date(report.created_at);
  const updatedDate = new Date(report.updated_at);

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-28 pb-20 px-6">
      <div className="max-w-3xl mx-auto">

        {/* Back Nav */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-white/40 hover:text-white font-sans text-sm mb-12 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-12"
        >
          <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
            <Hash className="w-3 h-3" />
            {report.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="text-4xl md:text-5xl font-sans font-light mb-4">{report.title}</h1>
          {report.description && (
            <p className="text-white/50 font-sans text-lg leading-relaxed">{report.description}</p>
          )}
        </motion.div>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex items-start gap-4 p-6 border rounded-2xl mb-8 ${config.bg}`}
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div>
            <p className={`font-sans font-semibold mb-1 ${config.color}`}>{config.label}</p>
            <p className="text-white/50 font-sans text-sm leading-relaxed">{config.desc}</p>
          </div>
        </motion.div>

        {/* Progress Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 mb-8"
        >
          <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-8">Project Progress</p>
          <StatusTimeline currentStatus={report.status} />
        </motion.div>

        {/* Meta Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          {[
            {
              icon: CalendarDays,
              label: 'Submitted',
              value: createdDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            },
            {
              icon: Clock,
              label: 'Last Updated',
              value: updatedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
            },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/[0.02] border border-white/5 rounded-xl p-6">
              <div className="flex items-center gap-2 text-white/30 mb-2">
                <Icon className="w-4 h-4" />
                <p className="font-sans text-xs uppercase tracking-widest">{label}</p>
              </div>
              <p className="text-white font-sans text-sm">{value}</p>
            </div>
          ))}
        </motion.div>

        {/* Footer Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-2xl"
        >
          <div>
            <p className="text-white/80 font-sans font-medium">Need changes or updates?</p>
            <p className="text-white/30 font-sans text-sm">Get in touch with our team directly.</p>
          </div>
          <Link
            to="/contact"
            className="px-6 py-3 border border-white/10 rounded-full font-sans text-sm hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            Contact Us →
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
