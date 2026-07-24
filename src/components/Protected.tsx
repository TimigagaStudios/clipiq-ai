import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { AuthScreen } from "./AuthScreen";

/**
 * Gate for protected views (the Dashboard).
 * - While the session restores: a loading state.
 * - Configured + no session: the login / signup screen.
 * - Not configured (guest mode) OR a real session: render children.
 *
 * Account details and sign-out live in Dashboard's profile menu so mobile does
 * not get a detached status bar above the app header.
 */
export function Protected({ children }: { children: ReactNode }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] text-sm text-zinc-400">
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
