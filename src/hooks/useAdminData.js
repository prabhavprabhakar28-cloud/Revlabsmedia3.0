import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useAdminData — fetches all users, reports, and payments for admin panel.
 * Only works when the authenticated user has role = 'admin'.
 */
export function useAdminData() {
  const { isAdmin } = useAuth();
  const [users, setUsers]       = useState([]);
  const [reports, setReports]   = useState([]);
  const [payments, setPayments] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchAll = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);

    const [usersRes, reportsRes, paymentsRes, portfolioRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('reports').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('payments').select('*, profiles(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('portfolio').select('*').order('created_at', { ascending: false }),
    ]);

    if (usersRes.error)    setError(usersRes.error.message);
    if (reportsRes.error)  setError(reportsRes.error.message);
    if (paymentsRes.error) setError(paymentsRes.error.message);
    if (portfolioRes.error) setError(portfolioRes.error.message);

    setUsers(usersRes.data ?? []);
    setReports(reportsRes.data ?? []);
    setPayments(paymentsRes.data ?? []);
    setPortfolio(portfolioRes.data ?? []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    fetchAll();

    if (!isAdmin) return;

    // Real-time for admin
    const reportsChannel = supabase
      .channel('admin:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchAll)
      .subscribe();

    const paymentsChannel = supabase
      .channel('admin:payments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchAll)
      .subscribe();

    const portfolioChannel = supabase
      .channel('admin:portfolio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio' }, fetchAll)
      .subscribe();

    return () => {
      supabase.removeChannel(reportsChannel);
      supabase.removeChannel(paymentsChannel);
      supabase.removeChannel(portfolioChannel);
    };
  }, [isAdmin, fetchAll]);

  const updateReportStatus = async (reportId, status) => {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId);
    if (error) throw error;
    await fetchAll();
  };

  const updateUserRole = async (userId, role) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) throw error;
    await fetchAll();
  };

  // ── Portfolio CRUD ──
  const addProject = async (projectData) => {
    const { error } = await supabase.from('portfolio').insert([projectData]);
    if (error) throw error;
    await fetchAll();
  };

  const updateProject = async (projectId, projectData) => {
    const { error } = await supabase.from('portfolio').update(projectData).eq('id', projectId);
    if (error) throw error;
    await fetchAll();
  };

  const deleteProject = async (projectId) => {
    const { error } = await supabase.from('portfolio').delete().eq('id', projectId);
    if (error) throw error;
    await fetchAll();
  };

  return {
    users, reports, payments, portfolio, loading, error,
    updateReportStatus, updateUserRole,
    addProject, updateProject, deleteProject,
    refetch: fetchAll,
  };
}
