// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (import.meta as any)?.env?.VITE_SUPABASE_URL || 'https://nphfdolcupkyvjyglgjx.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta as any)?.env?.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_CvibSXcrIeikPhwwPqGTAA_nfzgu1pA';

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
