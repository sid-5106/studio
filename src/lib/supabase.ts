import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Public client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (e.g., in Server Components, API routes, Server Actions)
// This should only be used in server environments and never exposed to the client.
let adminClient: SupabaseClient;

// The service key is only available on the server, so we conditionally initialize
// the admin client. This prevents the app from crashing on the client side.
if (supabaseServiceKey) {
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  // In a client-side context, supabaseServiceKey will be undefined.
  // We assign a dummy object to prevent import errors. Client-side code should
  // never use the admin client anyway; it should use the public `supabase` client.
  adminClient = {} as SupabaseClient;
}

export const supabaseAdmin = adminClient;
