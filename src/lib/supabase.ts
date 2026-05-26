import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use environment variables, with safe fallbacks to prevent runtime crashes if they are missing.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'placeholder';

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (e.g., in Server Components, API routes, Server Actions)
// This uses the service_role key to bypass Row Level Security (RLS).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
