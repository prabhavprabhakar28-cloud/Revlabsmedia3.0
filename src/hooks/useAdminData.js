import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useAdminData — fetches all users, reports, payments, portfolio, meetings,
 * and notifications for the admin panel with full real-time subscriptions.
 *
 * Also exposes pre-computed analytics so admin components don't repeat
 * the same reduce/filter logic across multiple files.
 */
export function useAdminData() {
  const { isAdmin } = useAuth();

  const [users,         setUsers]         = useState([]);
  const [reports,       setReports]       = useState([]);
  const [payments,      setPayments]      = useState([]);
  const [portfolio,     setPortfolio]     = useState([]);
  const [meetings,      setMeetings]      = useState([]);
  const [auditLog,      setAuditLog]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  // ── Core Fetch ────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);

    const [usersRes, reportsRes, paymentsRes, portfolioRes, meetingsRes, auditRes] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('reports')
          .select('*, profiles(full_name, email, avatar_url)')
          .order('created_at', { ascending: false }),

        supabase
          .from('payments')
          .select('*, profiles(full_name, email)')
          .order('created_at', { ascending: false }),

        supabase
          .from('portfolio')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('meetings')
          .select('*, profiles(full_name, email), reports(title)')
          .order('scheduled_at', { ascending: true }),

        supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

    const firstError = [usersRes, reportsRes, paymentsRes, portfolioRes, meetingsRes]
      .find(r => r.error)?.error;
    if (firstError) setError(firstError.message);

    setUsers(usersRes.data ?? []);
    setReports(reportsRes.data ?? []);
    setPayments(paymentsRes.data ?? []);
    setPortfolio(portfolioRes.data ?? []);
    setMeetings(meetingsRes.data ?? []);
    setAuditLog(auditRes.data ?? []);
    setLoading(false);
  }, [isAdmin]);

  // ── Real-time Subscriptions ───────────────────────────────────
  useEffect(() => {
    fetchAll();
    if (!isAdmin) return;

    // Subscribe to ALL admin-relevant tables
    const channels = [
      supabase.channel('admin:profiles')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAll)
        .subscribe(),

      supabase.channel('admin:reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAll)
        .subscribe(),

      supabase.channel('admin:payments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchAll)
        .subscribe(),

      supabase.channel('admin:portfolio')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio' }, fetchAll)
        .subscribe(),

      supabase.channel('admin:meetings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, fetchAll)
        .subscribe(),

      supabase.channel('admin:audit_log')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, fetchAll)
        .subscribe(),
    ];

    return () => channels.forEach(ch => supabase.removeChannel(ch));
  }, [isAdmin, fetchAll]);

  // ── Pre-computed Analytics (memoized, no stale reads) ─────────
  const analytics = useMemo(() => {
    const now = new Date();
    const oneWeekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // ── Users ──
    const newUsersThisWeek  = users.filter(u => new Date(u.created_at) >= oneWeekAgo).length;
    const newUsersLastWeek  = users.filter(u => {
      const d = new Date(u.created_at);
      return d < oneWeekAgo && d >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    }).length;
    const userGrowthPct = newUsersLastWeek === 0
      ? (newUsersThisWeek > 0 ? 100 : 0)
      : Math.round(((newUsersThisWeek - newUsersLastWeek) / newUsersLastWeek) * 100);

    // ── Payments ──
    const paidPayments     = payments.filter(p => p.status === 'paid');
    const pendingPayments  = payments.filter(p => p.status === 'pending');
    const failedPayments   = payments.filter(p => p.status === 'failed');

    const totalRevenue     = paidPayments.reduce((s, p) => s + Number(p.amount), 0);
    const monthlyRevenue   = paidPayments
      .filter(p => new Date(p.created_at) >= oneMonthAgo)
      .reduce((s, p) => s + Number(p.amount), 0);
    const weeklyRevenue    = paidPayments
      .filter(p => new Date(p.created_at) >= oneWeekAgo)
      .reduce((s, p) => s + Number(p.amount), 0);
    const prevMonthRevenue = paidPayments
      .filter(p => {
        const d = new Date(p.created_at);
        return d >= twoMonthsAgo && d < oneMonthAgo;
      })
      .reduce((s, p) => s + Number(p.amount), 0);

    const revenueGrowthPct = prevMonthRevenue === 0
      ? (monthlyRevenue > 0 ? 100 : 0)
      : Math.round(((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100);

    const avgOrderValue = paidPayments.length > 0
      ? Math.round(totalRevenue / paidPayments.length)
      : 0;

    // ── Monthly revenue chart data (last 6 months) ──
    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      const value = paidPayments
        .filter(p => {
          const pd = new Date(p.created_at);
          return pd >= d && pd < monthEnd;
        })
        .reduce((s, p) => s + Number(p.amount), 0);
      return {
        name: d.toLocaleString('default', { month: 'short' }),
        value,
        fullDate: d,
      };
    });

    // ── Reports / Projects ──
    const reportsByStatus = reports.reduce((acc, r) => {
      const stage = r.workflow_stage || r.status || 'pending';
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {});
    const pendingReports   = (reportsByStatus['pending']   || 0);
    const activeProjects   = reports.filter(r => {
      const stage = r.workflow_stage || r.status;
      return !['completed', 'cancelled', 'rejected'].includes(stage);
    }).length;

    // ── Meetings ──
    const upcomingMeetings = meetings.filter(m =>
      m.status === 'pending' || m.status === 'confirmed'
    ).length;

    return {
      // Users
      totalUsers: users.length,
      newUsersThisWeek,
      userGrowthPct,

      // Revenue
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      prevMonthRevenue,
      revenueGrowthPct,
      avgOrderValue,
      revenueByMonth,

      // Payment counts
      paidCount:    paidPayments.length,
      pendingCount: pendingPayments.length,
      failedCount:  failedPayments.length,

      // Projects
      activeProjects,
      pendingReports,
      reportsByStatus,

      // Meetings
      upcomingMeetings,
    };
  }, [users, reports, payments, meetings]);

  // ── Mutations ─────────────────────────────────────────────────

  const updateReportStatus = async (reportId, status, workflowStage) => {
    const update = {};
    if (status)        update.status         = status;
    if (workflowStage) update.workflow_stage = workflowStage;

    const { error } = await supabase
      .from('reports')
      .update(update)
      .eq('id', reportId);
    if (error) throw error;
  };

  const updateReportAssignment = async (reportId, updates) => {
    const { error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId);
    if (error) throw error;
  };

  const updateUserRole = async (userId, role) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
  };

  const updateMeetingStatus = async (meetingId, status, meetLink = null) => {
    const updates = { status };
    if (meetLink) updates.meet_link = meetLink;
    const { error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', meetingId);
    if (error) throw error;
  };

  // ── Portfolio CRUD ──────────────────────────────────────────
  const addProject = async (projectData) => {
    const { error } = await supabase.from('portfolio').insert([projectData]);
    if (error) throw error;
  };

  const updateProject = async (projectId, projectData) => {
    const { error } = await supabase.from('portfolio').update(projectData).eq('id', projectId);
    if (error) throw error;
  };

  const deleteProject = async (projectId) => {
    const { error } = await supabase.from('portfolio').delete().eq('id', projectId);
    if (error) throw error;
  };

  // ── Notification Sender ──────────────────────────────────────
  const sendNotification = async ({ userId, type, title, message, relatedId }) => {
    const { error } = await supabase.from('notifications').insert([{
      user_id:    userId,
      type,
      title,
      message,
      related_id: relatedId,
    }]);
    if (error) console.error('[sendNotification] failed:', error.message);
  };

  return {
    // Raw data
    users, reports, payments, portfolio, meetings, auditLog,
    loading, error,

    // Analytics (pre-computed)
    analytics,

    // Mutations
    updateReportStatus,
    updateReportAssignment,
    updateUserRole,
    updateMeetingStatus,
    addProject,
    updateProject,
    deleteProject,
    sendNotification,
    refetch: fetchAll,
  };
}
