import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdminData } from '../../hooks/useAdminData';
import { Calendar, Loader2, Video, CheckCircle, X, Clock, User } from 'lucide-react';

const STATUS_STYLES = {
  pending:   'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  confirmed: 'bg-blue-500/10   border-blue-500/20   text-blue-400',
  cancelled: 'bg-red-500/10    border-red-500/20    text-red-400',
  completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
};

const MEETING_ICONS = {
  discovery:  Video,
  onboarding: User,
  revision:   Clock,
  general:    Calendar,
};

export default function AdminMeetings() {
  const { meetings, loading, updateMeetingStatus, sendNotification } = useAdminData();
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter]     = useState('all');
  const [meetLinkModal, setMeetLinkModal] = useState(null); // { meetingId, userId }
  const [meetLinkInput, setMeetLinkInput] = useState('');

  const filtered = meetings.filter(m => filter === 'all' || m.status === filter);

  const handleConfirm = async (meeting) => {
    // Open modal to enter meet link
    setMeetLinkModal({ meetingId: meeting.id, userId: meeting.user_id, meeting });
    setMeetLinkInput('');
  };

  const handleConfirmSubmit = async () => {
    if (!meetLinkModal) return;
    setUpdating(meetLinkModal.meetingId);
    try {
      const meetLink = meetLinkInput.trim() || `https://meet.google.com/${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 5)}-${Math.random().toString(36).slice(2, 5)}`;
      await updateMeetingStatus(meetLinkModal.meetingId, 'confirmed', meetLink);

      // Notify client
      await sendNotification({
        userId:    meetLinkModal.userId,
        type:      'meeting_confirmed',
        title:     'Meeting Confirmed!',
        message:   `Your ${meetLinkModal.meeting.meeting_type} meeting has been confirmed. Join link: ${meetLink}`,
        relatedId: meetLinkModal.meetingId,
      });
      setMeetLinkModal(null);
    } catch (err) {
      console.error('Failed to confirm meeting:', err.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (meeting) => {
    if (!window.confirm('Cancel this meeting request?')) return;
    setUpdating(meeting.id);
    try {
      await updateMeetingStatus(meeting.id, 'cancelled');
      await sendNotification({
        userId:    meeting.user_id,
        type:      'meeting_cancelled',
        title:     'Meeting Cancelled',
        message:   `Your ${meeting.meeting_type} meeting has been cancelled. Please reach out to reschedule.`,
        relatedId: meeting.id,
      });
    } catch (err) {
      console.error('Failed to cancel meeting:', err.message);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-sans font-light text-white tracking-tight">
            Meeting <span className="font-serif italic text-white/40">Schedule</span>
          </h2>
          <p className="text-white/40 font-sans text-sm mt-1">
            Confirm client meeting requests and send Google Meet links.
          </p>
        </div>
        <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
          {['all', 'pending', 'confirmed', 'cancelled', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-lg font-sans text-[11px] font-bold uppercase tracking-widest transition-all ${
                filter === s ? 'bg-white text-black' : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              {s}
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
          <Calendar className="w-12 h-12 text-white/5 mx-auto mb-4" />
          <p className="text-white/30 font-sans text-lg">No meetings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(meeting => {
            const Icon = MEETING_ICONS[meeting.meeting_type] || Calendar;
            return (
              <motion.div
                key={meeting.id}
                layout
                className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <Icon className="w-5 h-5 text-white/40" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider font-sans ${STATUS_STYLES[meeting.status]}`}>
                        {meeting.status}
                      </span>
                      <span className="text-white/30 font-sans text-xs capitalize">{meeting.meeting_type}</span>
                    </div>
                    <h3 className="text-white font-sans font-medium">
                      {meeting.profiles?.full_name || '—'}
                    </h3>
                    <p className="text-white/40 font-sans text-sm">{meeting.profiles?.email}</p>
                    {meeting.reports?.title && (
                      <p className="text-white/30 font-sans text-xs mt-1">Re: {meeting.reports.title}</p>
                    )}
                    {meeting.client_notes && (
                      <p className="text-white/50 font-sans text-sm mt-2 italic">"{meeting.client_notes}"</p>
                    )}
                    {meeting.meet_link && (
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-sans text-xs mt-2 transition-colors"
                      >
                        <Video className="w-3 h-3" />
                        {meeting.meet_link}
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-white font-sans text-sm font-medium">
                      {new Date(meeting.scheduled_at).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                    <p className="text-white/40 font-sans text-xs">
                      {new Date(meeting.scheduled_at).toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit'
                      })} · {meeting.duration_mins} mins
                    </p>
                  </div>

                  {meeting.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(meeting)}
                        disabled={updating === meeting.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-sans text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
                      >
                        {updating === meeting.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(meeting)}
                        disabled={updating === meeting.id}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-sans text-xs font-bold transition-colors disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Meet Link Modal ── */}
      {meetLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-serif italic text-white mb-2">Confirm Meeting</h3>
            <p className="text-white/40 font-sans text-sm mb-6">
              Enter a Google Meet link, or leave blank to auto-generate a placeholder.
            </p>
            <input
              type="url"
              placeholder="https://meet.google.com/xxx-xxx-xxx"
              value={meetLinkInput}
              onChange={e => setMeetLinkInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-white/30 mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={handleConfirmSubmit}
                disabled={updating !== null}
                className="flex-1 py-3 rounded-xl bg-white text-black font-sans font-semibold hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Confirm & Notify Client
              </button>
              <button
                onClick={() => setMeetLinkModal(null)}
                className="px-6 py-3 border border-white/10 text-white/50 rounded-xl font-sans text-sm hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
