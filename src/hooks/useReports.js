import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useReports — fetches the current user's reports with real-time updates.
 */
export function useReports() {
  const { user } = useAuth();
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchReports = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setReports(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchReports();

    if (!user) return;

    // Real-time subscription
    const channel = supabase
      .channel(`reports:user:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports', filter: `user_id=eq.${user.id}` },
        () => fetchReports()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, fetchReports]);

  const createReport = async ({ title, description }) => {
    if (!user) throw new Error('Not authenticated');
    if (!title?.trim()) throw new Error('Title is required');

    const { data, error } = await supabase
      .from('reports')
      .insert({ user_id: user.id, title: title.trim(), description: description?.trim() })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  return { reports, loading, error, createReport, refetch: fetchReports };
}
