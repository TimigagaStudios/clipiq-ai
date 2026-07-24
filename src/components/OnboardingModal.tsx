import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import type { Profile } from "../lib/profile";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const roles = ["Creator", "Editor", "Marketer", "Agency owner", "Other"];
const platforms = ["YouTube", "TikTok", "Instagram", "Podcast", "Other"];

export function OnboardingModal({ profile, save }: { profile: Profile; save: (updates: Partial<Profile>) => Promise<{ error?: string }> }) {
  const [step, setStep] = useState(Math.max(2, profile.onboarding_step || 1));
  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [workspace, setWorkspace] = useState(profile.workspace_name ?? "");
  const [role, setRole] = useState(profile.role ?? "");
  const [platform, setPlatform] = useState(profile.primary_platform ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const next = async () => {
    setError("");
    if (step === 2 && !workspace.trim()) return setError("Enter your workspace name to continue.");
    if (step === 3 && (!firstName.trim() || !lastName.trim() || !role || !platform)) return setError("Complete every field to finish your profile.");
    setBusy(true);
    const updates: Partial<Profile> = step === 2
      ? { workspace_name: workspace.trim(), onboarding_step: 3 }
      : { first_name: firstName.trim(), last_name: lastName.trim(), display_name: `${firstName.trim()} ${lastName.trim()}`, role, primary_platform: platform, onboarding_step: 3, onboarding_completed_at: new Date().toISOString() };
    const result = await save(updates); setBusy(false);
    if (result.error) setError(result.error); else if (step === 2) setStep(3);
  };
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><div className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#120d1f] shadow-2xl"><div className="aurora h-28 opacity-60" /><div className="relative -mt-16 p-6 sm:p-8"><div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-lg"><Sparkles /></div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Welcome to ClipIQ</p><h2 className="mt-2 text-2xl font-bold">{step === 2 ? "Name your workspace" : "Set up your creator profile"}</h2><p className="mt-2 text-sm text-muted-foreground">Step {step} of 3 - Your account is ready. {step === 2 ? "Now create the home for your clips." : "Tell us how you create content."}</p><div className="my-6 flex gap-2">{[1,2,3].map(n => <span key={n} className={`h-1.5 flex-1 rounded-full ${n <= step ? "bg-brand" : "bg-white/10"}`} />)}</div>{step === 2 ? <div className="space-y-2"><label className="text-sm font-medium">Workspace name</label><Input value={workspace} onChange={e => setWorkspace(e.target.value)} placeholder="e.g. Timothy's Studio" className="h-12" /></div> : <div className="space-y-4"><div className="grid grid-cols-2 gap-3"><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" className="h-12" /><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" className="h-12" /></div><select value={role} onChange={e => setRole(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#100b1d] px-3 text-sm text-white"><option value="">Select your role</option>{roles.map(x => <option key={x}>{x}</option>)}</select><select value={platform} onChange={e => setPlatform(e.target.value)} className="h-12 w-full rounded-xl border border-white/10 bg-[#100b1d] px-3 text-sm text-white"><option value="">Primary content platform</option>{platforms.map(x => <option key={x}>{x}</option>)}</select></div>}{error && <p className="mt-4 text-sm text-red-400">{error}</p>}<Button onClick={() => void next()} disabled={busy} className="mt-6 w-full h-12">{busy ? "Saving..." : step === 2 ? "Continue" : <><Check className="mr-2 h-4 w-4" /> Finish setup</>}</Button></div></div></div>;
}
