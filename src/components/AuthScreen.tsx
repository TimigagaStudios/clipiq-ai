import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) setMessage({ type: "error", text: error });
      } else {
        const { error, needsEmailConfirmation } = await signUp(email, password);
        if (error) {
          setMessage({ type: "error", text: error });
        } else if (needsEmailConfirmation) {
          setMessage({
            type: "info",
            text: "Account created. Check your email to confirm it, then sign in.",
          });
          setMode("signin");
        } else {
          setMessage({ type: "info", text: "Account created — you're signed in." });
        }
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{mode === "signin" ? "Sign in to ClipIQ" : "Create your account"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password (min 6 chars)"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {message && (
              <p
                className={
                  message.type === "error" ? "text-sm text-red-400" : "text-sm text-emerald-400"
                }
              >
                {message.text}
              </p>
            )}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-zinc-400">
            {mode === "signin" ? "No account? " : "Already have one? "}
            <button
              type="button"
              className="text-violet-400 underline-offset-2 hover:underline"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage(null);
              }}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}