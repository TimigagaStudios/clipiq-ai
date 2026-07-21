// src/lib/supabase.ts
// ---------------------------------------------------------------------------
// Supabase client (Phase 2 setup). Consumed by Auth (Phase 3) and by the data
// layer that later replaces the in-memory mock in api/lib/store.js + server.js.
//
// SECURITY MODEL: the anon key is PUBLIC — it is shipped to the browser and
// embedded in the bundle. Access control is enforced by Row Level Security
// policies in the database, NOT by keeping the anon key secret. The
// service-role key must NEVER appear here or in any VITE_ variable.
//
// IMPORT SAFETY: importing this module NEVER throws, even when the env vars
// are missing, so the live UI keeps rendering before Supabase is configured.
// Use getSupabase() at the call site when you need a guaranteed client; it
// throws a clear, actionable error if the env is not set.
//
// TYPED CLIENT: a generated Database generic can be added later with:
//   npx supabase gen types typescript --local > src/lib/database.types.ts
// then createClient<Database>(...).
// ---------------------------------------------------------------------------

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.',
    );
  }
  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

// Convenience singleton. `null` when not configured so that simply importing
// this file (e.g. on a deployment that has no Supabase env vars yet) never
// crashes the app. Prefer getSupabase() where a client is required.
export const supabase: SupabaseClient | null = isSupabaseConfigured ? getSupabase() : null;
