import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "./supabase";

interface AuthContextValue {
  /** Whether Supabase env vars are present (auth active vs guest mode). */
  isConfigured: boolean;
  /** True while the initial session is being restored. */
  loading: boolean;
  user: User | null;
  session: Session | null;
  /** Allowed into protected views: guest mode (not configured) OR a real session. */
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = isSupabaseConfigured;
  const [session, setSession] = useState<Session | null>(null);
  // Only show a loading state when auth is actually active.
  const [loading, setLoading] = useState<boolean>(isConfigured);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    const supabase = getSupabase();

    // Restore a persisted session (survives reloads / new tabs).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    // Keep state in sync on login / logout / token refresh / other tabs.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isConfigured]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isConfigured) return { error: "Authentication is not configured yet." };
      const { error } = await getSupabase().auth.signInWithPassword({ email, password });
      return { error: error?.message };
    },
    [isConfigured],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!isConfigured) return { error: "Authentication is not configured yet." };
      const { data, error } = await getSupabase().auth.signUp({ email, password });
      if (error) return { error: error.message };
      // When email confirmation is enabled, the session is null until confirmed.
      return { needsEmailConfirmation: !data.session };
    },
    [isConfigured],
  );

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    await getSupabase().auth.signOut();
  }, [isConfigured]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      loading,
      user: session?.user ?? null,
      session,
      isAuthenticated: !isConfigured || !!session,
      signIn,
      signUp,
      signOut,
    }),
    [isConfigured, loading, session, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}