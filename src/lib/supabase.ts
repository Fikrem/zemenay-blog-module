import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Avoid initializing on the server during build/prerender
export const supabase = typeof window !== 'undefined' 
  ? createBrowserSupabaseClient() 
  : (null as unknown as ReturnType<typeof createBrowserSupabaseClient>);
