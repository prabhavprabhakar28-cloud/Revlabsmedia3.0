// Utility to call the send-email Supabase Edge Function
import { supabase } from './supabase';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`;

/**
 * sendEmail — calls the send-email Edge Function.
 * Does NOT throw; errors are logged silently so they never break the UI.
 */
export async function sendEmail({ type, to, name, data = {} }) {
  try {
    const session = await supabase.auth.getSession();
    const token = session?.data?.session?.access_token;

    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ type, to, name, data }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('[sendEmail] Edge function error:', err);
    }
  } catch (err) {
    console.warn('[sendEmail] Failed silently:', err.message);
  }
}
