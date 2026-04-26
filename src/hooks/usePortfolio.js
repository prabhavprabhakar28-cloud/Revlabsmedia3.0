import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function usePortfolio() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  return {
    projects,
    loading,
    error,
    refresh: fetchPortfolio,
  };
}
