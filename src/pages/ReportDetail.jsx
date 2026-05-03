import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import FileUpload from '../components/FileUpload';
import ProjectInstructions from '../components/ProjectInstructions';
import ScheduleMeeting from '../components/ScheduleMeeting';
import {
  ArrowLeft, Clock, CheckCircle, XCircle, Package,
  Loader2, CalendarDays, Hash, AlertCircle,
  Upload, MessageSquare, Calendar, CreditCard,
} from 'lucide-react';

const STATUS_CONFIG = {
  pending:            { label: 'Pending Review',   color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20',  desc: 'Your project is awaiting review from our team.' },
  approved:           { label: 'Approved',         color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',     desc: 'Project approved — work begins soon.' },
  in_editing:         { label: 'In Editing',       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', desc: 'Our team is actively working on your project.' },
  review:             { label: 'Under Review',     color: 'text-cyan-400',   bg: 'bg-cyan-500/10 border-cyan-500/20',     desc: 'The project is being reviewed internally.' },
  revision_requested: { label: 'Revision',         color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', desc: 'Changes are being applied based on feedback.' },
  final_delivery:     { label: 'Final Delivery',   color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', desc: 'Final files are being prepared for delivery.' },
  completed:          { label: 'Completed',        color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   desc: 'Project completed and delivered. Thank you!' },
  rejected:           { label: 'Not Approved',     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20',       desc: 'This request could not be approved. Contact us for details.' },
};

const TIMELINE = ['pending','approved','in_editing','review','final_delivery','completed'];

function StatusTimeline({ current }) {
  if (current === 'rejected') return (
    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
      <XCircle className="w-5 h-5 text-red-400 shrink-0"/>
      <p className="font-sans text-sm text-red-400">This project request was not approved.</p>
    </div>
  );

  const idx = TIMELINE.indexOf(current);
  return (
    <div className="relative overflow-x-auto pb-2">
      <div className="flex items-center min-w-max gap-0">
        {TIMELINE.map((step, i) => {
          const done = i <= idx;
          const labels = { pending:'Pending', approved:'Approved', in_editing:'Editing', review:'Review', final_delivery:'Delivery', completed:'Done' };
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${done ? 'bg-white border-white' : 'bg-transparent border-white/10'}`}>
                  <CheckCircle className={`w-4 h-4 ${done ? 'text-black' : 'text-white/10'}`}/>
                </div>
                <p className={`font-sans text-[10px] uppercase tracking-widest ${done ? 'text-white' : 'text-white/20'}`}>{labels[step]}</p>
              </div>
              {i < TIMELINE.length - 1 && (
                <div className={`h-px w-12 mx-1 mb-5 transition-all duration-500 ${i < idx ? 'bg-white/40' : 'bg-white/10'}`}/>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const SECTION_TABS = [
  { id: 'overview',     label: 'Overview',     icon: Hash },
  { id: 'files',        label: 'Files',        icon: Upload },
  { id: 'instructions', label: 'Instructions', icon: MessageSquare },
  { id: 'meeting',      label: 'Meeting',      icon: Calendar },
];

export default function ReportDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [report, setReport]       = useState(null);
  const [files, setFiles]         = useState([]);
  const [meetings, setMeetings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeSection, setActiveSection] = useState('overview');

  const fetchReport = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: err } = await supabase
      .from('reports').select('*').eq('id', id).eq('user_id', user.id).single();
    if (err || !data) { setError('Report not found or access denied.'); setLoading(false); return; }
    setReport(data);

    // Fetch files
    const { data: filesData } = await supabase.from('project_files').select('*').eq('report_id', id).order('created_at', { ascending: false });
    setFiles(filesData ?? []);

    // Fetch meetings for this report
    const { data: meetData } = await supabase.from('meetings').select('*').eq('user_id', user.id).eq('report_id', id).order('scheduled_at', { ascending: true });
    setMeetings(meetData ?? []);

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    fetchReport();
    const channelId = Math.random().toString(36).substring(7);
    const ch = supabase.channel(`report:${id}:${channelId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'reports', filter: `id=eq.${id}` },
        (p) => setReport(p.new))
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [id, fetchReport]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 text-white/20 animate-spin"/></div>;

  if (error || !report) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6"/>
        <h2 className="text-2xl font-serif italic mb-3">Not Found</h2>
        <p className="text-white/40 font-sans mb-8">{error}</p>
        <Link to="/dashboard" className="px-6 py-3 bg-white text-black rounded-full font-sans font-semibold hover:bg-white/90">Back to Dashboard</Link>
      </div>
    </div>
  );

  const stage  = report.workflow_stage || report.status || 'pending';
  const config = STATUS_CONFIG[stage] ?? STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-[#000000] text-white pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* Back */}
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-white/40 hover:text-white font-sans text-sm mb-10 transition-colors group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform"/>Back to Dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
            <Hash className="w-3 h-3"/>{report.id.slice(0, 8).toUpperCase()}
          </p>
          <h1 className="text-4xl md:text-5xl font-sans font-light mb-3">{report.title}</h1>
          {report.description && <p className="text-white/50 font-sans text-lg leading-relaxed">{report.description}</p>}
        </motion.div>

        {/* Status Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className={`flex items-start gap-4 p-5 border rounded-2xl mb-8 ${config.bg}`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
            <Package className={`w-5 h-5 ${config.color}`}/>
          </div>
          <div>
            <p className={`font-sans font-semibold mb-0.5 ${config.color}`}>{config.label}</p>
            <p className="text-white/50 font-sans text-sm">{config.desc}</p>
          </div>
          {report.deadline && (
            <div className="ml-auto shrink-0 text-right">
              <p className="text-white/20 font-sans text-[10px] uppercase tracking-widest">Deadline</p>
              <p className="text-white/60 font-sans text-sm">{new Date(report.deadline).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
            </div>
          )}
        </motion.div>

        {/* Progress Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-8">
          <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-6">Project Progress</p>
          <StatusTimeline current={stage}/>
        </motion.div>

        {/* Section Tabs */}
        <div className="flex gap-1 border-b border-white/5 pb-px mb-8 overflow-x-auto">
          {SECTION_TABS.map(({ id: sid, label, icon: Icon }) => (
            <button key={sid} onClick={() => setActiveSection(sid)}
              className={`flex items-center gap-2 px-4 py-2.5 font-sans text-sm transition-all border-b-2 -mb-px whitespace-nowrap ${activeSection === sid ? 'border-white text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}>
              <Icon className="w-4 h-4"/>{label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeSection === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: CalendarDays, label: 'Submitted', value: new Date(report.created_at).toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) },
              { icon: Clock, label: 'Last Updated', value: new Date(report.updated_at).toLocaleDateString('en-US',{weekday:'long',day:'numeric',month:'long',year:'numeric'}) },
              ...(report.service_type ? [{ icon: Package, label: 'Service', value: report.service_type }] : []),
              ...(report.assigned_to  ? [{ icon: Hash,   label: 'Assigned To', value: report.assigned_to }] : []),
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white/[0.02] border border-white/5 rounded-xl p-5">
                <div className="flex items-center gap-2 text-white/30 mb-2">
                  <Icon className="w-4 h-4"/>
                  <p className="font-sans text-xs uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-white font-sans text-sm">{value}</p>
              </div>
            ))}
            {/* CTA */}
            <div className="sm:col-span-2 flex flex-col sm:flex-row gap-4 items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-xl">
              <div>
                <p className="text-white/80 font-sans font-medium">Need changes or updates?</p>
                <p className="text-white/30 font-sans text-sm">Get in touch with our team.</p>
              </div>
              <Link to="/contact" className="px-6 py-2.5 border border-white/10 rounded-full font-sans text-sm hover:bg-white/5 transition-colors whitespace-nowrap">
                Contact Us →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Files */}
        {activeSection === 'files' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-white/40 font-sans text-sm mb-6 leading-relaxed">
              Upload reference files, assets, scripts, or paste Google Drive / Dropbox links.
            </p>
            <FileUpload reportId={report.id} existingFiles={files} onFilesChange={setFiles}/>
          </motion.div>
        )}

        {/* Instructions */}
        {activeSection === 'instructions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-white/40 font-sans text-sm mb-6 leading-relaxed">
              Leave detailed notes, style preferences, or specific requirements for the team.
            </p>
            <ProjectInstructions reportId={report.id}/>
          </motion.div>
        )}

        {/* Meeting */}
        {activeSection === 'meeting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-white/40 font-sans text-sm mb-6 leading-relaxed">
              Schedule a call with the RevLabs team to discuss this project.
            </p>
            <ScheduleMeeting reportId={report.id} existingMeetings={meetings}/>
          </motion.div>
        )}

      </div>
    </div>
  );
}
