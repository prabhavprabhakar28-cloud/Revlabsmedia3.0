import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  Calendar, Clock, Video, User, MessageSquare,
  CheckCircle, Loader2, AlertCircle, ChevronRight,
} from 'lucide-react';

const MEETING_TYPES = [
  { id: 'discovery',  label: 'Discovery Call',   desc: 'Discuss your project goals and requirements.',   icon: Video },
  { id: 'onboarding', label: 'Onboarding',        desc: 'Get started and align on the project plan.',     icon: User },
  { id: 'revision',   label: 'Revision Meeting',  desc: 'Review feedback and request specific changes.', icon: MessageSquare },
  { id: 'general',    label: 'General Call',      desc: 'Any other topic or check-in with the team.',    icon: Calendar },
];

const DURATIONS = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hour' },
];

// Generate next 14 days (excluding past dates)
function getAvailableDates() {
  const dates = [];
  const now = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    if (d.getDay() !== 0 && d.getDay() !== 6) { // weekdays only
      dates.push(d);
    }
  }
  return dates;
}

// Available time slots
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'
];

export default function ScheduleMeeting({ reportId, existingMeetings = [] }) {
  const { user } = useAuth();

  const [step, setStep]           = useState(1); // 1: type, 2: date/time, 3: notes, 4: success
  const [meetingType, setMeetingType] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration]   = useState(30);
  const [notes, setNotes]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const availableDates = getAvailableDates();

  const handleBook = async () => {
    if (!meetingType || !selectedDate || !selectedTime) return;
    setLoading(true);
    setError('');

    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hours, minutes, 0, 0);

      const { error: insertError } = await supabase
        .from('meetings')
        .insert({
          user_id:       user.id,
          report_id:     reportId || null,
          meeting_type:  meetingType,
          scheduled_at:  scheduledAt.toISOString(),
          duration_mins: duration,
          client_notes:  notes.trim() || null,
          status:        'pending',
        });

      if (insertError) throw insertError;
      setStep(4);
    } catch (err) {
      setError(err.message || 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1);
    setMeetingType('');
    setSelectedDate(null);
    setSelectedTime('');
    setNotes('');
    setError('');
  };

  // Show existing upcoming meetings
  const upcomingMeetings = existingMeetings.filter(m =>
    new Date(m.scheduled_at) > new Date() && m.status !== 'cancelled'
  );

  return (
    <div className="space-y-6">

      {/* Existing Meetings */}
      {upcomingMeetings.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/40 font-sans text-xs uppercase tracking-widest">Upcoming Meetings</p>
          {upcomingMeetings.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <div className="p-2 bg-white/5 rounded-lg shrink-0">
                <Calendar className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-sans text-sm capitalize">{m.meeting_type} call</p>
                <p className="text-white/40 font-sans text-xs">
                  {new Date(m.scheduled_at).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })} at {new Date(m.scheduled_at).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase font-sans px-2 py-1 rounded-full border ${
                  m.status === 'confirmed' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                  m.status === 'pending'   ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10' :
                                             'text-white/40 border-white/10 bg-white/5'
                }`}>{m.status}</span>
                {m.meet_link && (
                  <a
                    href={m.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 font-sans text-xs hover:bg-blue-500/20 transition-colors"
                  >
                    <Video className="w-3 h-3" />
                    Join
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Steps */}
      {step === 4 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-10"
        >
          <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl font-serif italic text-white mb-2">Meeting Requested!</h3>
          <p className="text-white/40 font-sans text-sm mb-6">
            The team will confirm your slot and send a Google Meet link shortly.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2.5 border border-white/10 text-white/60 rounded-xl font-sans text-sm hover:bg-white/5 hover:text-white transition-all"
          >
            Schedule Another
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-sans transition-all ${
                  s === step ? 'bg-white text-black' : s < step ? 'bg-white/20 text-white/60' : 'bg-white/5 text-white/20'
                }`}>{s}</div>
                {s < 3 && <div className={`flex-1 h-px ${s < step ? 'bg-white/20' : 'bg-white/5'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Meeting Type */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <p className="text-white/60 font-sans text-sm mb-4">What type of meeting do you need?</p>
              {MEETING_TYPES.map(({ id, label, desc, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setMeetingType(id); setStep(2); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200 ${
                    meetingType === id
                      ? 'border-white/30 bg-white/5'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                    <Icon className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-sans font-medium text-sm">{label}</p>
                    <p className="text-white/30 font-sans text-xs mt-0.5">{desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <p className="text-white/60 font-sans text-sm">Select a date and time:</p>

              {/* Date Picker */}
              <div>
                <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-3">Date</p>
                <div className="grid grid-cols-5 gap-2">
                  {availableDates.map((date, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <p className="font-sans text-[10px] uppercase tracking-wider">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="font-sans font-bold text-sm mt-0.5">
                        {date.getDate()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-3">Time (IST)</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 rounded-xl border text-center transition-all font-sans text-sm ${
                          selectedTime === slot
                            ? 'border-white bg-white text-black font-semibold'
                            : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration */}
              <div>
                <p className="text-white/30 font-sans text-xs uppercase tracking-widest mb-3">Duration</p>
                <div className="flex gap-2">
                  {DURATIONS.map(d => (
                    <button
                      key={d.value}
                      onClick={() => setDuration(d.value)}
                      className={`px-4 py-2 rounded-xl border font-sans text-sm transition-all ${
                        duration === d.value
                          ? 'border-white bg-white text-black font-semibold'
                          : 'border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-white/10 text-white/40 rounded-xl font-sans text-sm hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  className="flex-1 py-2.5 bg-white text-black rounded-xl font-sans font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Notes + Confirm */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                <p className="text-white/40 font-sans text-xs uppercase tracking-widest">Meeting Summary</p>
                <div className="space-y-2">
                  {[
                    { label: 'Type',     value: MEETING_TYPES.find(m => m.id === meetingType)?.label },
                    { label: 'Date',     value: selectedDate?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) },
                    { label: 'Time',     value: `${selectedTime} IST` },
                    { label: 'Duration', value: `${duration} minutes` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/30 font-sans text-sm">{label}</span>
                      <span className="text-white font-sans text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-white/30 font-sans text-xs uppercase tracking-widest block mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Topics you'd like to discuss, specific questions, agenda..."
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-white font-sans text-sm focus:outline-none focus:border-white/30 transition-colors resize-none placeholder:text-white/20"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 font-sans text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 border border-white/10 text-white/40 rounded-xl font-sans text-sm hover:bg-white/5 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleBook}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white text-black rounded-xl font-sans font-semibold text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {loading ? 'Scheduling…' : 'Confirm Meeting Request'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
