import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Dedicated Supabase client for the student email/password session.
// Uses a different storage key so teacher and student sessions never interfere.
// Students do NOT use OAuth (intentionally — would cap us at 100 users).
export const supabaseStudent = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'wit_dungeon_student_auth',
  },
});
