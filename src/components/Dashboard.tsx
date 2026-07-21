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
  Share2
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { cn } from "../utils/cn";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-white/10 text-white" 
        : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}
  >
    <Icon className={cn("w-5 h-5", active ? "text-white" : "text-muted-foreground group-hover:text-white")} />
    <span className="font-medium text-sm">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill" 
        className="ml-auto w-1.5 h-1.5 rounded-full bg-white" 
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
  const [clips, setClips] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load pending URL from landing page and fetch initial data
  useEffect(() => {
    const pendingUrl = localStorage.getItem("clipiq_pending_url");
    if (pendingUrl) {
      setUrl(pendingUrl);
      localStorage.removeItem("clipiq_pending_url");
    }
    fetchProjects();
    fetchHistory();
    fetchAnalytics();
  }, []);

  // Poll job status
  useEffect(() => {
    if (!jobId || !isAnalyzing) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}/status`);
        const data = await res.json();
        setAnalyzeProgress(data.progress);
        setAnalyzeMessage(data.message);
        if (data.status === "completed") {
          setIsAnalyzing(false);
          fetchClips(jobId);
          fetchProjects();
          if (pollingRef.current) clearInterval(pollingRef.current);
        } else if (data.status === "failed") {
          setIsAnalyzing(false);
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

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects`);
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/history`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/analytics`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    }
  };

  const fetchClips = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/clips`);
      const data = await res.json();
      setClips(data.clips || []);
    } catch (err) {
      console.error("Failed to fetch clips:", err);
    }
  };

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
      setJobId(data.jobId);
      setAnalyzeProgress(data.progress);
      setAnalyzeMessage(data.message);
    } catch (err: any) {
      setIsAnalyzing(false);
      setError(err.message || "Failed to start analysis");
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden relative">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 p-6 flex-col gap-8 shrink-0">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap className="text-black w-5 h-5 fill-black" />
          </div>
          <span className="font-bold text-xl tracking-tight">ClipIQ AI</span>
        </div>
        <nav className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
          <SidebarItem icon={Plus} label="Generate" active={activeTab === "generate"} onClick={() => setActiveTab("generate")} />
          <SidebarItem icon={History} label="History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
          <SidebarItem icon={BarChart3} label="Analytics" active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")} />
        </nav>
        <div className="space-y-1 pt-4 border-t border-white/5">
          <SidebarItem icon={Settings} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Credits</span>
              <Badge className="bg-white/10 text-[10px] h-5">Free Plan</Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span>10 mins left</span>
                <span className="text-muted-foreground">/ 10 mins</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-full bg-white" />
              </div>
            </div>
            <Button className="w-full text-xs h-8 bg-white text-black hover:bg-white/90">Upgrade Pro</Button>
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
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#09090b] border-r border-white/10 z-[70] p-6 flex flex-col gap-8 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <Zap className="text-black w-5 h-5 fill-black" />
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
              <div className="mt-auto pt-4 border-t border-white/5">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Storage</span>
                    <span className="text-xs">8.2 / 10 GB</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[82%] bg-white" />
                  </div>
                  <Button className="w-full bg-white text-black hover:bg-white/90">Upgrade</Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 px-4 lg:px-8 flex items-center justify-between bg-[#09090b]/50 backdrop-blur-md z-40 sticky top-0">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-hidden">
              <span className="hidden sm:inline">Dashboard</span>
              <ChevronRight className="w-4 h-4 hidden sm:inline shrink-0" />
              <span className="text-white capitalize truncate">{activeTab}</span>
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
            <Button variant="ghost" size="icon" className="relative shrink-0">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#09090b]" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border border-white/20 shrink-0" />
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
                    <Button className="flex-1 sm:flex-none bg-white text-black hover:bg-white/90 text-xs font-bold">Export</Button>
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
                    
                    <Card className="bg-white/[0.02] border-white/5">
                      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="flex gap-4 items-center w-full sm:w-auto">
                           <Button size="icon" variant="ghost" className="shrink-0"><Play className="w-4 h-4 fill-white" /></Button>
                           <div className="h-1.5 flex-1 sm:w-48 bg-white/10 rounded-full relative">
                              <div className="absolute left-0 top-0 h-full w-1/3 bg-white rounded-full" />
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
                    <Card className="bg-white/[0.02] border-white/5">
                      <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Captions</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {["I think the most important thing is...", "to focus on the user experience.", "Because at the end of the day..."].map((cap, i) => (
                          <div key={i} className={cn(
                            "p-3 rounded-xl border text-[11px] transition-colors cursor-pointer",
                            i === 0 ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-transparent opacity-50 hover:opacity-100"
                          )}>
                            "{cap}"
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.02] border-white/5">
                      <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Styles</CardTitle></CardHeader>
                      <CardContent className="grid grid-cols-2 gap-2">
                        {['Default', 'Bold', 'Subtitle', 'Comic'].map(style => (
                          <Button key={style} variant="outline" className={cn(
                            "text-[10px] h-10 rounded-xl",
                            style === 'Bold' && "bg-white/10 border-white/20"
                          )}>{style}</Button>
                        ))}
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.02] border-white/5">
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
                    { label: "Total Videos", value: projects.length.toString(), icon: Video, change: `+${projects.length} total` },
                    { label: "Total Clips", value: clips.length.toString() || "48", icon: Zap, change: "+12 this week" },
                    { label: "Est. Views", value: "125.4K", icon: TrendingUp, change: "+18% vs last week" },
                    { label: "Time Saved", value: "14.5h", icon: Clock, change: "+2.1h this week" },
                  ].map((stat, i) => (
                    <Card key={i} className="bg-white/[0.02] border-white/5">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                        <stat.icon className="w-4 h-4 text-muted-foreground" />
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
                    <Card className="bg-white/[0.02] border-white/5 overflow-hidden">
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
                              className="h-12 px-8 bg-white text-black hover:bg-white/90 gap-2 min-w-[120px]"
                            >
                              {isAnalyzing ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 fill-black" />
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
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                  {analyzeMessage}
                                </span>
                                <span>{analyzeProgress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${analyzeProgress}%` }}
                                  className="h-full bg-white" 
                                />
                              </div>
                            </motion.div>
                          )}

                          {/* Generated Clips */}
                          {!isAnalyzing && clips.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-4 pt-4 border-t border-white/5"
                            >
                              <h3 className="text-sm font-semibold">Generated Clips ({clips.length})</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {clips.map((clip) => (
                                  <Card key={clip.id} className="bg-white/[0.02] border-white/5 overflow-hidden group">
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
                                        <Button size="sm" className="flex-1 text-[10px] h-8 bg-white text-black hover:bg-white/90">
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
                              <div key={i} className="w-7 h-7 rounded-full border-2 border-[#09090b] bg-white/10 flex items-center justify-center text-[10px] font-bold">
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
                              className="bg-white/[0.02] border-white/5 group cursor-pointer overflow-hidden"
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
                    <Card className="bg-white/[0.02] border-white/5">
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
                                className="h-full bg-white" 
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    <Card className="bg-white/[0.02] border-white/5">
                      <CardHeader>
                        <CardTitle className="text-base">Recent Activities</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">Render completed</p>
                              <p className="text-[10px] text-muted-foreground">"The Future of Work" - Clip #{i}</p>
                            </div>
                            <span className="ml-auto text-[10px] text-muted-foreground whitespace-nowrap">{i}m ago</span>
                          </div>
                        ))}
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
                <Card className="bg-white/[0.02] border-white/5 p-4 lg:p-8 overflow-x-auto">
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
                  <Card className="bg-white/[0.02] border-white/5 p-6 space-y-4">
                    <h3 className="font-bold text-sm">Top Performing Clips</h3>
                    {analytics.topClips.map((clip: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer">
                        <div className="w-12 h-12 rounded-lg bg-white/10 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{clip.title}</p>
                          <p className="text-[10px] text-muted-foreground">{clip.views} views Ã¢ÂÂ¢ {clip.engagement} engagement</p>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px] shrink-0">{clip.change}</Badge>
                      </div>
                    ))}
                  </Card>
                  <Card className="bg-white/[0.02] border-white/5 p-6 space-y-4">
                    <h3 className="font-bold text-sm">Platform Distribution</h3>
                    <div className="space-y-4">
                      {analytics.platformDistribution.map((p: any) => (
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
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Clear History</Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No exports yet.</p>
                  ) : (
                    history.map((item, i) => (
                      <Card key={item.id} className="bg-white/[0.02] border-white/5 p-4 flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-full sm:w-32 aspect-video bg-white/10 rounded-lg shrink-0 overflow-hidden">
                          <img 
                            src={item.thumbnail} 
                            className="w-full h-full object-cover"
                            alt={item.title}
                          />
                        </div>
                        <div className="flex-1 space-y-1 text-center sm:text-left">
                          <h4 className="font-bold text-sm">{item.title}</h4>
                          <p className="text-xs text-muted-foreground">Exported {timeAgo(item.exportedAt)} Ã¢ÂÂ¢ {item.format} Ã¢ÂÂ¢ {item.resolution}</p>
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
                <h2 className="text-2xl font-bold">Settings</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                  <div className="lg:col-span-1">
                    <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-4 no-scrollbar">
                      {['Profile', 'Billing', 'Security', 'API', 'Team'].map((item, i) => (
                        <Button 
                          key={item} 
                          variant="ghost" 
                          className={cn(
                            "justify-start text-sm",
                            i === 0 ? "bg-white/5 text-white" : "text-muted-foreground"
                          )}
                        >
                          {item}
                        </Button>
                      ))}
                    </nav>
                  </div>
                  <div className="lg:col-span-3 space-y-6">
                    <Card className="bg-white/[0.02] border-white/5">
                      <CardHeader>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                        <CardDescription>Update your profile and contact details.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</label>
                            <Input placeholder="John Doe" className="bg-white/5 border-white/10" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</label>
                            <Input placeholder="john@example.com" className="bg-white/5 border-white/10" />
                          </div>
                        </div>
                        <Button className="bg-white text-black hover:bg-white/90">Save Changes</Button>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.02] border-white/5">
                      <CardHeader>
                        <CardTitle className="text-lg">Subscription Plan</CardTitle>
                        <CardDescription>Manage your current subscription and billing cycle.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/10">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm">ClipIQ Free</h4>
                              <p className="text-xs text-muted-foreground">10 minutes remaining this month</p>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full sm:w-auto text-xs gap-2"><CreditCard className="w-3.5 h-3.5" /> Manage Billing</Button>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white/[0.02] border-white/5">
                      <CardHeader>
                        <CardTitle className="text-lg">Danger Zone</CardTitle>
                        <CardDescription>Irreversible actions for your account.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="destructive" className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20">Delete Account</Button>
                      </CardContent>
                    </Card>
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
