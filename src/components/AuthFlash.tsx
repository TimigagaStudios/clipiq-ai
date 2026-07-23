import { useEffect } from "react";
import { useAuth } from "../lib/auth";

/**
 * Global, fixed toast for auth events (email-confirmed, redirect errors, etc.).
 * Rendered once inside <AuthProvider>; auto-dismisses after a few seconds.
 */
export function AuthFlash() {
  const { flash, dismissFlash } = useAuth();

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(dismissFlash, 6000);
    return () => window.clearTimeout(id);
  }, [flash, dismissFlash]);

  if (!flash) return null;

  const styles =
    flash.type === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : flash.type === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : "border-sky-500/30 bg-sky-500/10 text-sky-200";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-4">
      <div
        role="status"
        className={`pointer-events-auto flex max-w-xl items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${styles}`}
      >
        <span className="flex-1">{flash.text}</span>
        <button
          type="button"
          onClick={dismissFlash}
          aria-label="Dismiss notification"
          className="opacity-70 transition hover:opacity-100"
        >
          â
        </button>
      </div>
    </div>
  );
}
