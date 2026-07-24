import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "../lib/auth";

const STEPS = [
  { n: 1, label: "Sign up your account" },
  { n: 2, label: "Set up your workspace" },
  { n: 3, label: "Set up your profile" },
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.9 3.3 14.7 2.4 12 2.4 6.9 2.4 2.8 6.5 2.8 11.6S6.9 20.8 12 20.8c5.9 0 9.8-4.1 9.8-9.9 0-.7-.1-1.2-.2-1.7H12z"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05A9.36 9.36 0 0 1 12 6.84c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export function AuthScreen() {
  const { signIn, signUp, resendConfirmation } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (!isSignup) {
        const { error } = await signIn(email, password);
        if (error) {
          setMessage(
            /confirm/i.test(error)
              ? {
                  type: "info",
                  text: "That account needs email confirmation first. Check your inbox, or resend below.",
                }
              : { type: "error", text: error },
          );
        }
      } else {
        const { error, needsEmailConfirmation } = await signUp(email, password);
        if (error) {
          setMessage({ type: "error", text: error });
        } else if (needsEmailConfirmation) {
          setMessage({ type: "info", text: "Account created. Check your email to confirm it, then sign in." });
          setMode("signin");
        } else {
          setMessage({ type: "info", text: "Account created Ã¢â¬â you're signed in." });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function onResend() {
    if (!email.trim()) {
      setMessage({ type: "info", text: "Enter your email above, then resend." });
      return;
    }
    setBusy(true);
    setMessage(null);
    const { error, sent } = await resendConfirmation(email.trim());
    setBusy(false);
    if (error) setMessage({ type: "error", text: error });
    else if (sent) setMessage({ type: "info", text: "If that email isn't confirmed yet, a new link is on its way." });
  }

  function onSocial(provider: string) {
    setMessage({ type: "info", text: `${provider} sign-in is coming soon Ã¢â¬â use email for now.` });
  }

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      {/* ambient brand glows (auth screen only) */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-brand/30 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-brand-2/20 blur-[120px]" />
      </div>

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c12cc] shadow-2xl backdrop-blur-xl md:grid-cols-2">
        {/* Brand panel Ã¢â¬â CSS aurora + scrim for legible text */}
        <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden bg-[#160a28] p-8 text-white md:p-10">
          <div className="aurora absolute -inset-[15%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/25" />
          <div className="relative z-10 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">ClipIQ AI</span>
          </div>

          <div className="relative z-10 space-y-3">
            <h2 className="text-3xl font-extrabold leading-tight md:text-4xl [text-shadow:0_2px_24px_rgba(0,0,0,0.45)]">
              {isSignup ? "Get Started with Us" : "Welcome Back"}
            </h2>
            <p className="max-w-xs text-sm text-white/85">
              {isSignup
                ? "Complete these easy steps to register your account."
                : "Sign in to pick up where you left off."}
            </p>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2">
            {STEPS.map((s) => {
              const active = s.n === 1;
              return (
                <div
                  key={s.n}
                  className={
                    "rounded-xl p-3 text-[11px] font-medium leading-tight " +
                    (active ? "bg-white text-black shadow-lg" : "bg-white/10 text-white/85 backdrop-blur-sm")
                  }
                >
                  <span
                    className={
                      "mb-2 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold " +
                      (active ? "bg-black text-white" : "bg-white/20 text-white")
                    }
                  >
                    {s.n}
                  </span>
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form panel */}
        <div className="p-8 md:p-10">
          <h1 className="text-2xl font-bold text-foreground">
            {isSignup ? "Sign Up Account" : "Sign in to ClipIQ"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup ? "Enter your details to create your account." : "Enter your details to continue."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSocial("Google")}
              className="soft-raised flex items-center justify-center gap-2 rounded-xl bg-[#151022] px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-[#1b1430] active:shadow-[inset_4px_4px_10px_rgba(3,2,8,0.7),inset_-3px_-3px_8px_rgba(99,72,156,0.16)]"
            >
              <GoogleIcon /> Google
            </button>
            <button
              type="button"
              onClick={() => onSocial("GitHub")}
              className="soft-raised flex items-center justify-center gap-2 rounded-xl bg-[#151022] px-3 py-2.5 text-sm font-medium text-foreground transition hover:bg-[#1b1430] active:shadow-[inset_4px_4px_10px_rgba(3,2,8,0.7),inset_-3px_-3px_8px_rgba(99,72,156,0.16)]"
            >
              <GithubIcon /> GitHub
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-white/10" /> Or <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="auth-email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="soft-pressed h-11 w-full rounded-xl bg-[#100b1d] px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPw ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="soft-pressed h-11 w-full rounded-xl bg-[#100b1d] px-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Must be at least 6 characters.</p>
            </div>

            {message && (
              <p className={"text-sm " + (message.type === "error" ? "text-red-400" : "text-emerald-400")}>
                {message.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="h-11 w-full rounded-xl border border-white/14 bg-[#765bd0] font-semibold text-white shadow-[0_11px_20px_rgba(4,2,10,0.64),0_4px_7px_rgba(49,31,105,0.42),inset_0_1px_1px_rgba(255,255,255,0.28),inset_0_-1px_1px_rgba(43,25,99,0.24)] transition hover:bg-[#8065dc] active:bg-[#694ebd] active:shadow-[inset_0_4px_8px_rgba(47,28,105,0.48),inset_0_-1px_1px_rgba(255,255,255,0.13)] disabled:opacity-60"
            >
              {busy ? "Please waitÃ¢â¬Â¦" : isSignup ? "Sign Up" : "Sign in"}
            </button>
          </form>

          {!isSignup && (
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Waiting on a confirmation email?{" "}
              <button
                type="button"
                onClick={onResend}
                disabled={busy}
                className="font-medium text-brand underline-offset-2 hover:underline disabled:opacity-50"
              >
                Resend it
              </button>
            </p>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account? " : "No account? "}
            <button
              type="button"
              onClick={() => {
                setMode(isSignup ? "signin" : "signup");
                setMessage(null);
              }}
              className="font-semibold text-brand underline-offset-2 hover:underline"
            >
              {isSignup ? "Log in" : "Create one"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}