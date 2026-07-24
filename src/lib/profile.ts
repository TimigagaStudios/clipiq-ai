import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import { useAuth } from "./auth";

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  workspace_name: string | null;
  role: string | null;
  primary_platform: string | null;
  onboarding_step: number;
  onboarding_completed_at: string | null;
};

export function initialsFor(profile: Profile | null, email?: string) {
  const letters = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join("");
  return letters ? letters.toUpperCase() : (email?.[0] ?? "C").toUpperCase();
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(Boolean(isSupabaseConfigured));
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !user) { setLoading(false); return; }
    setLoading(true); setError("");
    const supabase = getSupabase();
    let { data, error: selectError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (!data && !selectError) {
      const { error: insertError } = await supabase.from("profiles").insert({ id: user.id, email: user.email ?? "", display_name: user.email?.split("@")[0] ?? "" });
      if (insertError) selectError = insertError;
      else ({ data, error: selectError } = await supabase.from("profiles").select("*").eq("id", user.id).single());
    }
    if (selectError) setError(selectError.message); else setProfile(data as Profile);
    setLoading(false);
  }, [user]);

  useEffect(() => { void refresh(); }, [refresh]);

  const save = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return { error: "You need to sign in first." };
    const { data, error: updateError } = await getSupabase().from("profiles").update(updates).eq("id", user.id).select().single();
    if (updateError) return { error: updateError.message };
    setProfile(data as Profile); return { profile: data as Profile };
  }, [user]);

  return { profile, loading, error, save, refresh };
}
