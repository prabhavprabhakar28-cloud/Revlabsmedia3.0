import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useProfile — manages the current user's profile.
 */
export function useProfile() {
  const { user, profile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const save = async (updates) => {
    setSaving(true);
    setError(null);
    try {
      await updateProfile(updates);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return { profile, saving, error, save };
}
