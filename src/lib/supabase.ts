import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ieclswferflrofuvzgij.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_F5-N6D1qoM5brr9CmFc7eA_YXzxZuWv';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_WqRMUMZaujDjLhiRqchwPw_np-OM0nG';

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (e.g., in Server Components, API routes, Server Actions)
// This should only be used in server environments and never exposed to the client.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
