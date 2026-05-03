import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * usePayments — fetches the current user's payments with real-time updates.
 */
export function usePayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) setError(error.message);
    else setPayments(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchPayments();

    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`payments:user:${user.id}:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        () => fetchPayments()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, fetchPayments]);

  return { payments, loading, error, refetch: fetchPayments };
}
