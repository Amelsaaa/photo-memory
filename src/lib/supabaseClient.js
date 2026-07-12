import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// ✅ Singleton pattern: Pastikan hanya ada 1 instance Supabase client
let supabaseInstance = null;

export const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // ✅ Gunakan implicit flow (tidak butuh PKCE code verifier)
        flowType: "implicit",
        storage:
          typeof window !== "undefined" ? window.localStorage : undefined,
      },
    });
  }
  return supabaseInstance;
};

// Export instance langsung untuk backward compatibility
export const supabase = getSupabase();
