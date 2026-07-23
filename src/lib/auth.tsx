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

export type AuthFlash = { type: "success" | "error" | "info"; text: string };

interface AuthContextValue {
  isConfigured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  /** Guest mode (not configured) OR a real session. */
  isAuthenticated: boolean;
  flash: AuthFlash | null;
  dismissFlash: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error?: string; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<{ error?: string; sent?: boolean }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ---- Supabase implicit-flow redirect helpers ------------------------------

type CallbackParams = {
  token: boolean;
  type: string;
  error: string;
  errorDescription: string;
};

function readCallbackParams(): CallbackParams {
  if (typeof window === "undefined") {
    return { token: false, type: "", error: "", errorDescription: "" };
  }
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
  const hp = new URLSearchParams(hash);
  const sp = new URLSearchParams(window.location.search);
  const get = (k: string) => hp.get(k) || sp.get(k) || "";
  return {
    token: Boolean(hp.get("access_token") || sp.get("access_token")),
    type: get("type"),
    error: get("error"),
    errorDescription: get("error_description"),
  };
}

// Drop the token / error params (and the hash that held them) without a reload.
function cleanAuthUrl() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  [
    "error",
    "error_description",
    "error_code",
    "access_token",
    "refresh_token",
    "expires_in",
    "token_type",
    "type",
  ].forEach((k) => url.searchParams.delete(k));
  const search = url.searchParams.toString();
  window.history.replaceState({}, document.title, url.pathname + (search ? `?${search}` : ""));
}

function successFlashFor(type: string): AuthFlash {
  switch (type) {
    case "signup":
    case "invite":
      return { type: "success", text: "Email confirmed â you're signed in. ð" };
    case "recovery":
      return { type: "success", text: "Password reset complete â you're signed in." };
    case "email_change":
      return { type: "success", text: "Email address updated." };
    case "magic_link":
      return { type: "success", text: "Signed in via magic link." };
    default:
      return { type: "success", text: "Signed in successfully." };
  }
}

function errorFlashFor(cb: CallbackParams): AuthFlash {
  const desc = (cb.errorDescription || cb.error || "").toLowerCase();
  if (/expired|otp_expired|invalid_grant|token has expired/.test(desc)) {
    return {
      type: "error",
      text: "That link has expired or was already used. Please sign in or request a new email.",
    };
  }
  if (/already.*confirmed|email.*confirmed|user already registered/.test(desc)) {
    return { type: "info", text: "That email is already confirmed â go ahead and sign in." };
  }
  return {
    type: "error",
    text: cb.errorDescription
      ? `We couldn't complete that link: ${cb.errorDescription}`
      : "We couldn't complete that link. Please try signing in again.",
  };
}

// ---- Provider --------------------------------------------------------------

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = isSupabaseConfigured;
  const cb = useMemo(() => readCallbackParams(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(isConfigured);
  // A redirect error needs no session, so it can show on the very first render.
  const [flash, setFlash] = useState<AuthFlash | null>(() =>
    cb.error && !cb.token ? errorFlashFor(cb) : null,
  );

  const dismissFlash = useCallback(() => setFlash(null), []);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }
    let active = true;
    const supabase = getSupabase();

    // Pure redirect error (no token to exchange): safe to clean the URL now.
    if (cb.error && !cb.token) cleanAuthUrl();

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
      if (cb.token) {
        cleanAuthUrl();
        if (error || !data.session) {
          setFlash(
            errorFlashFor({
              ...cb,
              error: error?.message || cb.error,
              errorDescription: cb.errorDescription || error?.message || "",
            }),
          );
        } else {
          setFlash(successFlashFor(cb.type));
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [isConfigured, cb]);

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
      return { needsEmailConfirmation: !data.session };
    },
    [isConfigured],
  );

  const signOut = useCallback(async () => {
    if (!isConfigured) return;
    await getSupabase().auth.signOut();
  }, [isConfigured]);

  const resendConfirmation = useCallback(
    async (email: string) => {
      if (!isConfigured) return { error: "Authentication is not configured yet." };
      const { error } = await getSupabase().auth.resend({ type: "signup", email });
      return { error: error?.message, sent: !error };
    },
    [isConfigured],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured,
      loading,
      user: session?.user ?? null,
      session,
      isAuthenticated: !isConfigured || !!session,
      flash,
      dismissFlash,
      signIn,
      signUp,
      signOut,
      resendConfirmation,
    }),
    [isConfigured, loading, session, flash, dismissFlash, signIn, signUp, signOut, resendConfirmation],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an <AuthProvider>");
  return ctx;
}
