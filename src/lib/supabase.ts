import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Use environment variables, with safe fallbacks to prevent runtime crashes if they are missing.
// The strings 'https://placeholder.supabase.co' and 'placeholder' are valid URL/key formats
// that will satisfy the Supabase client initialization requirements without crashing the app.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (e.g., in Server Components, API routes, Server Actions)
// This should only be used in server environments and never exposed to the client.
let adminClient: SupabaseClient;

// The service key is only available on the server, so we conditionally initialize
// the admin client. This prevents the app from crashing on the client side.
if (supabaseServiceKey && supabaseUrl !== 'https://placeholder.supabase.co') {
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  // In a client-side context or if config is missing, we assign a dummy object.
  // Client-side code should never use the admin client anyway.
  adminClient = {} as SupabaseClient;
}

export const supabaseAdmin = adminClient;
