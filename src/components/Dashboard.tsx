import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Video, 
  History, 
  BarChart3, 
  Settings, 
  Plus, 
  Search, 
  Bell, 
  Play,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp,
  Menu,
  X,
  CreditCard,
  Download,
  Share2,
  LogOut,
  Check,
  CheckCheck,
  ShieldCheck,
  KeyRound,
  Users,
  CircleUserRound,
  UserRound
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../utils/cn";
import { useAuth } from "../lib/auth";
import { useProfile } from "../lib/profile";
import { OnboardingModal } from "./OnboardingModal";
import { getSupabase } from "../lib/supabase";
import { clearUserExports, completeUserJob, createUserExport, createUserJob, createUserProject, failUserJob, loadActiveJob, loadDashboardData, updateUserJob } from "../lib/dashboard-data";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-brand/15 text-white" 
        : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-muted-foreground group-hover:text-white")} />
    <span className="font-medium text-sm">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill" 
        className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-2" 
      />
    )}
  </button>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeMessage, setAnalyzeMessage] = useState("AI is identifying viral hooks...");
  const [url, setUrl] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [clips, setClips] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [savedTotals, setSavedTotals] = useState({ videos: 0, clips: 0, exports: 0 });
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState("Profile");
  const [settingsNotice, setSettingsNotice] = useState("");
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileWorkspace, setProfileWorkspace] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profilePlatform, setProfilePlatform] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { isConfigured, user, signOut } = useAuth();
  const { profile, loading: profileLoading, save: saveProfile } = useProfile();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isConfigured || !user) return;
    const loadNotifications = async () => {
      const supabase = getSupabase();
      let { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!data?.length) {
        await supabase.from("notifications").insert([
          { user_id: user.id, title: "Welcome to ClipIQ", detail: "Your creator workspace is ready to explore." },
          { user_id: user.id, title: "Tips for your first clip", detail: "Paste a long-form video link to start an analysis." },
        ]);
        ({ data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }));
      }
      setNotifications((data ?? []).map((item: any) => ({ ...item, unread: !item.is_read })));
    };
    void loadNotifications();
  }, [isConfigured, user]);

  async function markNotificationsRead(ids?: string[]) {
    if (!user) return;
    const target = ids ?? notifications.filter((item) => item.unread).map((item) => item.id);
    if (!target.length) return;
    setNotifications((items) => items.map((item) => target.includes(item.id) ? { ...item, unread: false } : item));
    await getSupabase().from("notifications").update({ is_read: true }).in("id", target).eq("user_id", user.id);
  }

  useEffect(() => {
    if (!profile) return;
    void Promise.resolve().then(() => {
      setProfileFirstName(profile.first_name ?? "");
      setProfileLastName(profile.last_name ?? "");
      setProfileWorkspace(profile.workspace_name ?? "");
      setProfileRole(profile.role ?? "");
      setProfilePlatform(profile.primary_platform ?? "");
    });
  }, [profile]);

  async function saveProfileFromSettings() {
    if (!profileFirstName.trim() || !profileLastName.trim() || !profileWorkspace.trim()) {
      setSettingsNotice("First name, last name, and workspace name are required.");
      return;
    }
    setSavingProfile(true);
    const result = await saveProfile({
      first_name: profileFirstName.trim(), last_name: profileLastName.trim(),
      display_name: `${profileFirstName.trim()} ${profileLastName.trim()}`,
      workspace_name: profileWorkspace.trim(), role: profileRole, primary_platform: profilePlatform,
    });
    setSavingProfile(false);
    setSettingsNotice(result.error ? result.error : "Profile saved successfully.");
  }

  function openBilling() {
    setActiveTab("settings");
    setActiveSettingsTab("Billing");
    setSettingsNotice("Choose a plan when secure billing and checkout are ready. Your current plan remains ClipIQ Free.");
    setIsMobileMenuOpen(false);
  }

  // Load pending URL and refresh the correct data source when auth is ready.
  useEffect(() => {
    const pendingUrl = localStorage.getItem("clipiq_pending_url");
    if (pendingUrl) {
      void Promise.resolve().then(() => setUrl(pendingUrl));
      localStorage.removeItem("clipiq_pending_url");
    }
  }, []);

  useEffect(() => {
    if (!isConfigured || !user) return;
    void loadActiveJob(user.id).then((activeJob) => {
      if (!activeJob) return;
      setSavedJobId(activeJob.id);
      setSavedProjectId(activeJob.projectId);
      setJobId(activeJob.externalJobId);
      setAnalyzeProgress(activeJob.progress);
      setAnalyzeMessage(activeJob.message);
      setIsAnalyzing(true);
    }).catch((err) => console.error("Failed to resume active job:", err));
  }, [isConfigured, user]);

  // Poll job status
  useEffect(() => {
    if (!jobId || !isAnalyzing) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/status`);
        const data = await res.json();
        setAnalyzeProgress(data.progress);
        setAnalyzeMessage(data.message);
        if (isConfigured && user && savedJobId) {
          await updateUserJob(user.id, savedJobId, { status: data.status, progress: data.progress, message: data.message });
        }
        if (data.status === "completed") {
          setIsAnalyzing(false);
          void fetchClips(jobId);
          void refreshDashboardData();
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.status === "failed") {
          setIsAnalyzing(false);
          if (isConfigured && user && savedJobId && savedProjectId) {
            await failUserJob(user.id, savedProjectId, savedJobId, data.message || "Analysis failed.");
          }
          setError("Analysis failed. Please try again.");
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    poll();
    pollingRef.current = setInterval(poll, 800);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId, isAnalyzing]);

  async function refreshDashboardData() {
    try {
      if (isConfigured && user) {
        const data = await loadDashboardData(user.id);
        setProjects(data.projects);
        setHistory(data.history);
        setSavedTotals(data.totals);
        setAnalytics(data.analytics);
        return;
      }
      const [projectsRes, historyRes, analyticsRes] = await Promise.all([
        fetch(`${API_BASE}/projects`), fetch(`${API_BASE}/history`), fetch(`${API_BASE}/analytics`),
      ]);
      const [projectsData, historyData, analyticsData] = await Promise.all([
        projectsRes.json(), historyRes.json(), analyticsRes.json(),
      ]);
      setProjects(projectsData.projects || []);
      setHistory(historyData.history || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to refresh dashboard:", err);
    }
  }

  async function fetchClips(id: string) {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/clips`);
      const data = await res.json();
      setClips(data.clips || []);
      if (isConfigured && user && savedJobId && savedProjectId) {
        await completeUserJob(user.id, savedProjectId, savedJobId, data.clips || []);
        await refreshDashboardData();
      }
    } catch (err) {
      console.error("Failed to fetch clips:", err);
    }
  }

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please enter a video URL");
      return;
    }
    setError("");
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    setAnalyzeMessage("Starting analysis...");
    setClips([]);

    try {
      const res = await fetch(`${API_BASE}/analyze-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), category: "auto" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      if (isConfigured && user) {
        const project = await createUserProject(user.id, url.trim());
        const databaseJobId = await createUserJob(user.id, project.id, url.trim(), data.jobId);
        setSavedProjectId(project.id); setSavedJobId(databaseJobId);
      }
      setJobId(data.jobId);
      setAnalyzeProgress(data.progress);
      setAnalyzeMessage(data.message);
    } catch (err: any) {
      setIsAnalyzing(false);
      setError(err.message || "Failed to start analysis");
    }
  };

  const handleExport = async (clip: Record<string, unknown>) => {
    if (!isConfigured || !user) {
      setSettingsNotice("Sign in with Supabase to save exports to your history.");
      return;
    }
    try {
      await createUserExport(user.id, clip);
      setSettingsNotice("Export saved to your history.");
      await refreshDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save export.");
    }
  };

  const handleClearHistory = async () => {
    if (!isConfigured || !user || !history.length) return;
    if (!window.confirm("Clear all saved export history? This will not delete your clips or projects.")) return;
    setClearingHistory(true);
    try {
      await clearUserExports(user.id);
      setSettingsNotice("Export history cleared.");
      await refreshDashboardData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear history.");
    } finally {
      setClearingHistory(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const [renderedAt] = useState(() => Date.now());

  const timeAgo = (iso: string) => {
    const diff = renderedAt - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden relative">
      {isConfigured && profile && !profileLoading && !profile.onboarding_completed_at && (
        <OnboardingModal profile={profile} save={saveProfile} />
      )}
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-white/10 p-6 flex-col gap-8 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-brand to-brand-2 rounded-lg flex items-center justify-center">
            <Zap className="text-white w-5 h-5 fill-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">ClipIQ AI</span>
        </div>
        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Plus} label="Generate" active={activeTab === "generate"} onClick={() => setActiveTab("generate")} />
          <SidebarItem icon={History} label="History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
        </nav>
        <div className="space-y-1 pt-4 border-t border-white/10">
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credits</span>
              <Badge className="bg-brand/20 text-brand-2 text-[10px] h-5">Free Plan</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>10 mins left</span>
                <span className="text-muted-foreground">/ 10 mins</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-full bg-gradient-to-r from-brand to-brand-2" />
              </div>
            </div>
            <Button onClick={openBilling} className="w-full text-xs h-8 hover:brightness-105">Upgrade Pro</Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-background border-r border-white/10 z-[70] p-6 flex flex-col gap-8 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-brand to-brand-2 rounded-lg flex items-center justify-center">
                    <Zap className="text-white w-5 h-5 fill-white" />
                  </div>
                  <span className="font-bold text-xl tracking-tight">ClipIQ AI</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <nav className="flex-1 space-y-2">
                <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => { setActiveTab("overview"); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={Plus} label="Generate" active={activeTab === "generate"} onClick={() => { setActiveTab("generate"); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={History} label="History" active={activeTab === "history"} onClick={() => { setActiveTab("history"); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "analytics"} onClick={() => { setActiveTab("analytics"); setIsMobileMenuOpen(false); }} />
                <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setIsMobileMenuOpen(false); }} />
              </nav>
              <div className="mt-auto pt-4 border-t border-white/10">
                <div className="p-4 rounded-2xl bg-brand/5 border border-brand/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Storage</span>
                    <span className="text-xs">8.2 / 10 GB</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[82%] bg-gradient-to-r from-brand to-brand-2" />
                  </div>
                  <Button onClick={openBilling} className="w-full hover:brightness-105">Upgrade</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/10 px-4 lg:px-8 flex items-center justify-between bg-background/50 backdrop-blur-md z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-bold uppercase tracking-[0.18em] text-brand/80 sm:block">ClipIQ dashboard</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white capitalize sm:text-xl">{activeTab}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-brand-2 shadow-[0_0_10px_rgba(255,77,141,0.85)]" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="bg-white/5 border-white/10 pl-9 w-40 lg:w-64 h-9 text-xs"
              />
            </div>
            <div className="relative shrink-0">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open notifications"
                aria-expanded={isNotificationOpen}
                onClick={() => setIsNotificationOpen((open) => !open)}
                className="relative"
              >
                <Bell className="w-5 h-5" />
                {notifications.some((notification) => notification.unread) && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                )}
              </Button>
              {isNotificationOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#151022] shadow-[0_18px_40px_rgba(0,0,0,0.58),inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-white">Notifications</p>
                      <p className="text-[11px] text-muted-foreground">Your latest ClipIQ updates</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void markNotificationsRead()}
                      className="flex items-center gap-1.5 text-xs font-medium text-brand transition hover:text-brand-2"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => void markNotificationsRead([notification.id])}
                        className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/6"
                      >
                        <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", notification.unread ? "bg-brand-2 shadow-[0_0_9px_rgba(255,77,141,0.9)]" : "bg-white/15")} />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-white">{notification.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{notification.detail}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsNotice("A full notification history will be saved when Phase 4 data features begin.")}
                    className="flex w-full items-center justify-center gap-2 border-t border-white/8 px-4 py-3 text-xs font-semibold text-brand transition hover:bg-white/5 hover:text-brand-2"
                  >
                    <Check className="h-3.5 w-3.5" /> View all notifications
                  </button>
                </div>
              )}
            </div>
            {isConfigured ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((open) => !open)}
                  aria-label="Open account menu"
                  aria-expanded={isAccountMenuOpen}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-[#765bd0] text-xs font-bold text-white shadow-[0_11px_20px_rgba(4,2,10,0.64),0_4px_7px_rgba(49,31,105,0.42),inset_0_1px_1px_rgba(255,255,255,0.28),inset_0_-1px_1px_rgba(43,25,99,0.24)] transition hover:bg-[#8065dc] hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                >
                  <UserRound className="h-5 w-5 fill-white/15 text-white" />
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#151022] shadow-[0_16px_35px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.08)]">
                    <div className="border-b border-white/8 bg-gradient-to-br from-brand/18 to-transparent px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">Creator profile</p>
                      <p className="mt-1 truncate text-base font-bold text-white">{profile?.display_name ?? "Your ClipIQ profile"}</p>
                      {profile?.workspace_name && <span className="mt-2 inline-flex rounded-full border border-brand/25 bg-brand/12 px-2.5 py-1 text-[11px] font-medium text-white">{profile.workspace_name}</span>}
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Email address</p>
                      <p className="mt-1 truncate text-sm text-white/80">{user?.email ?? "Signed in"}</p>
                    </div>
                    <div className="border-t border-white/8 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        void signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/8"
                    >
                      <LogOut className="h-4 w-4 text-brand-2" />
                      Sign out
                    </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full border border-white/20 bg-gradient-to-br from-brand to-brand-2 shrink-0" />
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            {selectedProject ? (
              <motion.div
                key="editor"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedProject(null)}>Back</Button>
                    <h2 className="text-lg lg:text-xl font-bold truncate max-w-[200px] sm:max-w-none">Project #{selectedProject}</h2>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none text-xs">Preview</Button>
                    <Button className="flex-1 sm:flex-none hover:brightness-105 text-xs font-bold">Export</Button>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="aspect-[9/16] max-w-[320px] mx-auto bg-black rounded-[2.5rem] border-[10px] border-[#1a1a1a] shadow-2xl relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0">
                        <img 
                          src={`https://images.unsplash.com/photo-${1611162617474 + selectedProject}-5b21e879e113?auto=format&fit=crop&q=80&w=800`} 
                          className="w-full h-full object-cover blur-sm opacity-50"
                          alt="Video bg"
                        />
                      </div>
                      <div className="relative z-10 w-full aspect-video bg-black/60 flex items-center justify-center">
                         <Play className="w-12 h-12 fill-white" />
                      </div>
                      <div className="absolute bottom-24 left-0 right-0 px-6 text-center">
                        <span className="bg-yellow-400 text-black px-2 py-1 font-black text-lg uppercase italic shadow-lg">
                          This is a viral hook!
                        </span>
                      </div>
                    </div>
                    
                    <Card className="bg-white/[0.03] border-white/10">
                      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="flex gap-4 items-center w-full sm:w-auto">
                           <Button size="icon" variant="ghost" className="shrink-0"><Play className="w-4 h-4 fill-white" /></Button>
                           <div className="h-1.5 flex-1 sm:w-48 bg-white/10 rounded-full relative">
                              <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-brand to-brand-2 rounded-full" />
                           </div>
                           <span className="text-[10px] font-mono shrink-0">0:12 / 0:45</span>
                         </div>
                         <div className="flex gap-2 w-full sm:w-auto">
                            <Button size="sm" variant="ghost" className="flex-1 sm:flex-none text-[10px]">Trim</Button>
                            <Button size="sm" variant="ghost" className="flex-1 sm:flex-none text-[10px]">Split</Button>
                         </div>
                      </div>
                    </Card>
                  </div>
                  <div className="space-y-6">
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Captions</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {["I think the most important thing is...", "to focus on the user experience.", "Because at the end of the day..."].map((cap, i) => (
                          <div key={i} className={cn(
                            "p-3 rounded-xl border text-[11px] transition-colors cursor-pointer",
                            i === 0 ? "bg-brand/10 border-brand/30" : "bg-white/[0.02] border-transparent opacity-50 hover:opacity-100"
                          )}>
                            "{cap}"
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Styles</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2">
                        {['Default', 'Bold', 'Subtitle', 'Comic'].map(style => (
                          <Button key={style} variant="outline" className={cn(
                            "text-[10px] h-10 rounded-xl",
                            style === 'Bold' && "bg-brand/15 border-brand/30"
                          )}>{style}</Button>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Assist</CardTitle></CardHeader>
                      <CardContent className="space-y-2">
                        <div className="p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/10 flex items-center gap-3">
                          <TrendingUp className="w-4 h-4 text-yellow-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-yellow-500">VIRAL HOOK</span>
                            <span className="text-[9px] text-yellow-500/70">89% Confidence</span>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-blue-500">AUTO-ZOOM</span>
                            <span className="text-[9px] text-blue-500/70">Active Face Tracking</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            ) : (activeTab === "overview" || activeTab === "generate") && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                    { label: "Total Videos", value: (isConfigured ? savedTotals.videos : projects.length).toString(), icon: Video, change: `+${projects.length} total` },
                    { label: "Total Clips", value: (isConfigured ? savedTotals.clips : clips.length).toString(), icon: Zap, change: isConfigured ? "Saved clips" : "Demo data" },
                    { label: "Est. Views", value: analytics?.estimatedViews ?? "0", icon: TrendingUp, change: isConfigured ? "Derived estimate" : "Demo data" },
                    { label: "Time Saved", value: analytics?.timeSaved ?? "0.0h", icon: Clock, change: isConfigured ? "Derived estimate" : "Demo data" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white/[0.03] border-white/10">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                        <stat.icon className="w-4 h-4 text-brand" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-[10px] text-green-500 mt-1 font-medium">{stat.change}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Generate Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/[0.03] border-white/10 overflow-hidden">
                      <div className="p-8 space-y-6">
                        <div className="space-y-2">
                          <h2 className="text-xl font-semibold">Generate New Clips</h2>
                          <p className="text-sm text-muted-foreground">Paste a link to your long-form content to start the AI analysis.</p>
                        </div>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-4">
                            <div className="relative flex-1">
                              <Plus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input 
                                placeholder="YouTube, Vimeo, or Direct URL" 
                                className="bg-white/5 border-white/10 pl-9 h-12"
                                disabled={isAnalyzing}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                              />
                            </div>
                            <Button 
                              onClick={handleAnalyze} 
                              disabled={isAnalyzing}
                              className="h-12 px-8 hover:brightness-105 gap-2 min-w-[120px]"
                            >
                              {isAnalyzing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 fill-white" />
                                  Analyze
                                </>
                              )}
                            </Button>
                          </div>
                          
                          {error && (
                            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                              {error}
                            </p>
                          )}
                          
                          {isAnalyzing && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="space-y-2"
                            >
                              <div className="flex justify-between text-xs font-medium">
                                <span className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-brand-2 rounded-full animate-pulse" />
                                  {analyzeMessage}
                                </span>
                                <span>{analyzeProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${analyzeProgress}%` }}
                                  className="h-full bg-gradient-to-r from-brand to-brand-2" 
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Generated Clips */}
                          {!isAnalyzing && clips.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4 pt-4 border-t border-white/10"
                            >
                              <h3 className="text-sm font-semibold">Generated Clips ({clips.length})</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {clips.map((clip) => (
                                  <Card key={clip.id} className="bg-white/[0.03] border-white/10 overflow-hidden group">
                                    <div className="aspect-video relative">
                                      <img 
                                        src={clip.thumbnail} 
                                        alt={clip.title}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button size="icon" variant="secondary" className="rounded-full">
                                          <Play className="w-4 h-4 fill-white" />
                                        </Button>
                                      </div>
                                      <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border-white/10">
                                        {clip.viralityScore}% Viral
                                      </Badge>
                                    </div>
                                    <div className="p-4 space-y-2">
                                      <h4 className="text-sm font-semibold truncate">{clip.title}</h4>
                                      <p className="text-xs text-muted-foreground line-clamp-2">{clip.hook}</p>
                                      <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" className="flex-1 text-[10px] h-8">
                                          Preview
                                        </Button>
                                        <Button size="sm" onClick={() => void handleExport(clip)} className="flex-1 text-[10px] h-8 hover:brightness-105">
                                          Export
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className="w-7 h-7 rounded-full border-2 border-background bg-white/10 flex items-center justify-center text-[10px] font-bold">
                                {i}
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">10,000+ creators analyzing daily</span>
                        </div>
                      </div>
                    </Card>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Recent Projects</h2>
                        <Button variant="link" className="text-sm text-muted-foreground">View all</Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {projects.length === 0 ? (
                          <p className="text-sm text-muted-foreground col-span-2">No projects yet. Paste a URL above to get started.</p>
                        ) : (
                          projects.slice(0, 4).map((project) => (
                            <Card 
                              key={project.id} 
                              onClick={() => setSelectedProject(project.id)}
                              className="bg-white/[0.03] border-white/10 group cursor-pointer overflow-hidden"
                            >
                              <div className="aspect-video relative">
                                <img 
                                  src={project.thumbnail} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                  alt="Video thumbnail"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <Button size="icon" variant="secondary" className="rounded-full"><Play className="w-4 h-4 fill-white" /></Button>
                                  <Button size="icon" variant="secondary" className="rounded-full"><ExternalLink className="w-4 h-4" /></Button>
                                </div>
                                <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-md border-white/10">{project.clipCount} Clips</Badge>
                              </div>
                              <div className="p-4">
                                <h3 className="text-sm font-semibold truncate mb-1">{project.title}</h3>
                                <p className="text-xs text-muted-foreground">Processed {formatDate(project.createdAt)}</p>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base">Virality Predictions</CardTitle>
                        <CardDescription className="text-xs">Based on current social trends</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[
                          { label: "Educational / AI", score: 92, status: "High" },
                          { label: "Motivational", score: 85, status: "Medium" },
                          { label: "Podcast Clips", score: 78, status: "Medium" },
                        ].map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>{item.label}</span>
                              <span className="text-white font-bold">{item.score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.score}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-brand to-brand-2" 
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.03] border-white/10">
                      <CardHeader>
                        <CardTitle className="text-base">Recent Activities</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {history.length === 0 && projects.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No activity yet. Analyze a video to create your first project.</p>
                        ) : (
                          [...history.slice(0, 3), ...projects.slice(0, 3)].slice(0, 3).map((item: any) => (
                            <div key={item.id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>
                              <div><p className="text-xs font-medium">{item.exportedAt ? "Export saved" : "Project created"}</p><p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{item.title}</p></div>
                              <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo(item.exportedAt || item.createdAt)}</span>
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "analytics" && analytics && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Analytics Overview</h2>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Last 7 Days</Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">Export Data</Button>
                  </div>
                </div>
                <Card className="bg-white/[0.03] border-white/10 p-4 lg:p-8 overflow-x-auto">
                  <div className="min-w-[500px] h-[200px] flex items-end gap-2">
                    {analytics.chartData.map((h: number, i: number) => (
                      <div key={i} className="flex-1 flex flex-col gap-2 items-center group">
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 1, delay: i * 0.05 }}
                          className="w-full bg-white/10 group-hover:bg-white transition-colors rounded-t-sm"
                        />
                        <span className="text-[10px] text-muted-foreground">Day {i+1}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-white/[0.03] border-white/10 p-6 space-y-4">
                    <h3 className="font-bold text-sm">Top Performing Clips</h3>
                    {analytics.topClips.length === 0 ? <p className="text-sm text-muted-foreground">No clip analytics yet.</p> : analytics.topClips.map((clip: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-lg bg-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{clip.title}</p>
                          <p className="text-[10px] text-muted-foreground">{clip.views} views ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ˘ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ˘ {clip.engagement} engagement</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] shrink-0">{clip.change}</Badge>
                      </div>
                    ))}
                  </Card>
                  <Card className="bg-white/[0.03] border-white/10 p-6 space-y-4">
                    <h3 className="font-bold text-sm">Platform Distribution</h3>
                    <div className="space-y-4">
                      {analytics.platformDistribution.length === 0 ? <p className="text-sm text-muted-foreground">No exports to measure yet.</p> : analytics.platformDistribution.map((p: any) => (
                        <div key={p.platform} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-muted-foreground">{p.platform}</span>
                            <span>{p.val}%</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className={cn("h-full", p.color)} style={{ width: `${p.val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {activeTab === "history" && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold">Export History</h2>
                  <Button variant="outline" size="sm" disabled={clearingHistory || !history.length} onClick={() => void handleClearHistory()} className="w-full sm:w-auto">{clearingHistory ? "Clearing..." : "Clear History"}</Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No exports yet.</p>
                  ) : (
                    history.map((item, i) => (
                      <Card key={item.id} className="bg-white/[0.03] border-white/10 p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full sm:w-32 aspect-video bg-white/10 rounded-lg shrink-0 overflow-hidden">
                          <img 
                            src={item.thumbnail} 
                            className="w-full h-full object-cover"
                            alt={item.title}
                          />
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <h4 className="font-bold text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">Exported {timeAgo(item.exportedAt)} ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ˘ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ˘ {item.format} ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ˘ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ˘ {item.resolution}</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-8 text-xs gap-2"><Download className="w-3.5 h-3.5" /> Download</Button>
                          <Button size="sm" variant="outline" className="flex-1 sm:flex-none h-8 text-xs gap-2"><Share2 className="w-3.5 h-3.5" /> Share</Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand/80">Account workspace</p>
                  <h2 className="mt-1 text-3xl font-bold tracking-tight">Settings</h2>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
                  <div className="lg:col-span-1">
                    <nav className="flex gap-2 overflow-x-auto pb-3 no-scrollbar lg:flex-col">
                      {["Profile", "Billing", "Security", "API", "Team"].map((item) => (
                        <Button
                          key={item}
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setActiveSettingsTab(item);
                            setSettingsNotice("");
                          }}
                          className={cn(
                            "shrink-0 justify-start px-4 text-sm",
                            activeSettingsTab === item
                              ? "bg-brand/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                              : "text-muted-foreground",
                          )}
                        >
                          {item}
                        </Button>
                      ))}
                    </nav>
                  </div>

                  <div className="space-y-6 lg:col-span-3">
                    {settingsNotice && (
                      <div className="flex items-start justify-between gap-4 rounded-xl border border-brand/25 bg-brand/10 px-4 py-3 text-sm text-white">
                        <span>{settingsNotice}</span>
                        <button type="button" onClick={() => setSettingsNotice("")} aria-label="Dismiss message" className="text-brand-2 hover:text-white">ĂÂĂÂĂÂĂÂĂÂĂÂĂÂĂÂ</button>
                      </div>
                    )}

                    {activeSettingsTab === "Profile" && (
                      <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg"><CircleUserRound className="h-5 w-5 text-brand" /> Personal Information</CardTitle>
                          <CardDescription>Update your profile and contact details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">First Name</label><Input value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)} placeholder="First name" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Name</label><Input value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} placeholder="Last name" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace</label><Input value={profileWorkspace} onChange={(e) => setProfileWorkspace(e.target.value)} placeholder="Your workspace" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label><Input value={user?.email ?? ""} readOnly className="opacity-70" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Role</label><Input value={profileRole} onChange={(e) => setProfileRole(e.target.value)} placeholder="Creator" /></div>
                            <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Primary Platform</label><Input value={profilePlatform} onChange={(e) => setProfilePlatform(e.target.value)} placeholder="YouTube" /></div>
                          </div>
                          <Button disabled={savingProfile} onClick={() => void saveProfileFromSettings()}>{savingProfile ? "Saving..." : "Save Changes"}</Button>
                        </CardContent>
                      </Card>
                    )}

                    {activeSettingsTab === "Billing" && (
                      <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg"><CreditCard className="h-5 w-5 text-brand" /> Subscription Plan</CardTitle>
                          <CardDescription>Review your current usage and plan options.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-4">
                              <div className="rounded-xl bg-brand/15 p-3"><Zap className="h-6 w-6 text-brand" /></div>
                              <div><h4 className="font-bold">ClipIQ Free</h4><p className="mt-1 text-xs text-muted-foreground">10 minutes of processing remaining this month</p></div>
                            </div>
                            <Button variant="outline" onClick={() => setSettingsNotice("Billing and upgrades are coming after the payment system is built.")}>Manage Billing</Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeSettingsTab === "Security" && (
                      <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-brand" /> Security</CardTitle>
                          <CardDescription>Keep your ClipIQ account protected.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><p className="font-semibold">Password protection</p><p className="mt-1 text-sm text-muted-foreground">Use a strong, unique password for your ClipIQ account.</p></div>
                          <Button variant="outline" onClick={() => setSettingsNotice("Password reset controls will be connected to Supabase Auth in a later authentication refinement.")}>Change Password</Button>
                        </CardContent>
                      </Card>
                    )}

                    {activeSettingsTab === "API" && (
                      <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg"><KeyRound className="h-5 w-5 text-brand" /> API Access</CardTitle>
                          <CardDescription>Connect ClipIQ to your own tools and workflows.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-6 text-center"><KeyRound className="mx-auto h-7 w-7 text-brand" /><p className="mt-3 font-semibold">API access is being prepared</p><p className="mt-1 text-sm text-muted-foreground">Keys cannot be created until secure server-side API support is available.</p></div>
                          <Button onClick={() => setSettingsNotice("API key generation needs secure server-side storage, so it is not available yet.")}>Request API Access</Button>
                        </CardContent>
                      </Card>
                    )}

                    {activeSettingsTab === "Team" && (
                      <Card className="bg-white/[0.03] border-white/10">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-brand" /> Team</CardTitle>
                          <CardDescription>Collaborate with editors, creators, and teammates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-6 text-center"><Users className="mx-auto h-7 w-7 text-muted-foreground" /><p className="mt-3 font-semibold">Your team workspace is ready</p><p className="mt-1 text-sm text-muted-foreground">Invite and permission controls will arrive with multi-user workspace data.</p></div>
                          <Button onClick={() => setSettingsNotice("Team invitations need saved workspace data, which is planned for a later Phase 4 step.")}>Invite Team Member</Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
