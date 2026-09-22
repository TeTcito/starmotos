// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL || 'https://djbvtgjykrkygkdhfhos.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqYnZ0Z2p5a3JreWdrZGhmaG9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMDg0MjksImV4cCI6MjEwNTU4NDQyOX0.SYX35H7VJxyH-4TZQYv5r_9XOZxMroJcmzzOhG5P3mk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
