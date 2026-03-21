import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Dedicated Supabase client for student Google OAuth.
// Uses a different storage key so teacher and student sessions never interfere.
// Only detect OAuth code when we're on the student portal route (/).
// At /professor the teacher client handles its own code; the student client
// must not try to exchange a code it has no verifier for.
const isStudentRoute = window.location.pathname === "/";

export const supabaseStudent = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: isStudentRoute,
    storageKey: 'wit_dungeon_student_auth',
  },
});
