import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, CreditCard, FileText, Calendar, MessageSquare, Package } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { Link } from 'react-router-dom';

const NOTIF_ICONS = {
  payment_success:   CreditCard,
  payment_failed:    CreditCard,
  status_update:     FileText,
  meeting_confirmed: Calendar,
  meeting_cancelled: Calendar,
  admin_reply:       MessageSquare,
  file_upload:       Package,
  refund_processed:  CreditCard,
};

const NOTIF_COLORS = {
  payment_success:   'text-emerald-400',
  payment_failed:    'text-red-400',
  status_update:     'text-blue-400',
  meeting_confirmed: 'text-purple-400',
  meeting_cancelled: 'text-red-400',
  admin_reply:       'text-amber-400',
  file_upload:       'text-white/60',
  refund_processed:  'text-blue-400',
};

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) markRead(notif.id);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-all"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center font-sans"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-80 bg-[#080808] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-white/40" />
                <h3 className="text-white font-sans font-medium text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 text-[10px] font-bold font-sans">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    title="Mark all read"
                    className="text-white/30 hover:text-white transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-8 h-8 text-white/5 mx-auto mb-3" />
                  <p className="text-white/20 font-sans text-sm">No notifications yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map(notif => {
                    const Icon  = NOTIF_ICONS[notif.type] || Bell;
                    const color = NOTIF_COLORS[notif.type] || 'text-white/40';
                    const linkTo = notif.related_id ? `/dashboard/report/${notif.related_id}` : '/dashboard';

                    return (
                      <Link
                        key={notif.id}
                        to={linkTo}
                        onClick={() => { handleNotifClick(notif); setOpen(false); }}
                        className={`flex items-start gap-3 p-4 hover:bg-white/[0.02] transition-colors ${
                          !notif.is_read ? 'bg-white/[0.02]' : ''
                        }`}
                      >
                        <div className={`p-2 rounded-lg bg-white/5 shrink-0 mt-0.5`}>
                          <Icon className={`w-3.5 h-3.5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-sans text-sm font-medium ${notif.is_read ? 'text-white/60' : 'text-white'}`}>
                              {notif.title}
                            </p>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-white shrink-0 mt-1" />
                            )}
                          </div>
                          {notif.message && (
                            <p className="text-white/30 font-sans text-xs mt-0.5 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          )}
                          <p className="text-white/20 font-sans text-[10px] mt-1">
                            {formatRelativeTime(notif.created_at)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-white/5">
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="block text-center text-white/30 font-sans text-xs hover:text-white/60 transition-colors py-1"
                >
                  View all in dashboard
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
