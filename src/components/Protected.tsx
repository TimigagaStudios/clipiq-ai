import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { AuthScreen } from "./AuthScreen";

/**
 * Gate for protected views (the Dashboard).
 * - While the session restores: a loading state.
 * - Configured + no session: the login / signup screen.
 * - Not configured (guest mode) OR a real session: render children, with a
 *   slim sign-out bar shown only when auth is actually active.
 *
 * Lives OUTSIDE Dashboard.tsx on purpose, so the big component stays untouched.
 */
export function Protected({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated, isConfigured, user, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-sm text-zinc-400">
        <span className="animate-pulse">Loading…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <>
      {isConfigured && (
        <div className="flex items-center justify-between border-b border-white/5 bg-[#0a0a0f]/80 px-4 py-2 text-xs text-zinc-400 backdrop-blur">
          <span className="truncate">{user?.email ?? "Signed in"}</span>
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="rounded-md px-2 py-1 text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      )}
      {children}
    </>
  );
}