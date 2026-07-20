import { motion } from "framer-motion";
import { 
  Zap, 
  Play, 
  Sparkles, 
  Share2, 
  TrendingUp, 
  Layers,
  CheckCircle2,
  ArrowRight,
  Video
} from "lucide-react";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Badge } from "./ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { cn } from "../utils/cn";

const LandingPage = ({ onGetStarted }: { onGetStarted: () => void }) => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-white/10">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <Zap className="text-black w-5 h-5 fill-black" />
            </div>
            <span className="font-bold text-xl tracking-tight">ClipIQ AI</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" className="text-xs sm:text-sm font-medium px-2 sm:px-4">Log in</Button>
            <Button onClick={onGetStarted} className="rounded-full px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm">Get Started</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-white/5 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full bg-white/5 border-white/10 text-white/80 gap-2 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Revolutionizing Video Content with AI
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
              Turn Long Videos Into <span className="text-gradient">Viral Shorts</span> in Minutes.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              ClipIQ AI automatically identifies the most engaging moments in your videos, 
              adds captions, and optimizes for TikTok, Reels, and Shorts.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-center p-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <div className="relative w-full">
              <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Paste YouTube Link" 
                className="bg-transparent border-none pl-11 h-12 focus-visible:ring-0 text-white"
              />
            </div>
            <Button onClick={onGetStarted} size="lg" className="w-full sm:w-auto rounded-xl bg-white text-black hover:bg-white/90">
              Generate Clips
            </Button>
          </motion.div>

          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              No credit card required
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              10 mins free every month
            </div>
          </div>
        </div>

      {/* Clip Examples */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex gap-4 overflow-x-auto pb-8 no-scrollbar">
          {[
            { label: "Podcast", color: "bg-purple-500" },
            { label: "Education", color: "bg-blue-500" },
            { label: "Gaming", color: "bg-red-500" },
            { label: "Business", color: "bg-green-500" },
            { label: "Motivation", color: "bg-orange-500" },
            { label: "Comedy", color: "bg-pink-500" }
          ].map((cat, i) => (
            <div key={i} className="flex-shrink-0 w-48 aspect-[9/16] rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden group">
              <div className={cn("absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity", cat.color)} />
              <div className="absolute inset-0 flex flex-col justify-end p-4">
                <span className="text-xs font-bold uppercase tracking-widest">{cat.label}</span>
                <div className="h-1 w-0 group-hover:w-full bg-white transition-all duration-300 mt-2" />
              </div>
              <Play className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="max-w-5xl mx-auto mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-white/5 bg-[#0a0a0a]">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
              <div className="mx-auto bg-white/5 px-3 py-1 rounded text-[10px] text-muted-foreground font-mono">
                clipiq.ai/dashboard
              </div>
            </div>
            <div className="aspect-video relative overflow-hidden group">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition-transform z-20">
                  <Play className="w-8 h-8 fill-white" />
                </div>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=2000" 
                alt="Dashboard Preview" 
                className="w-full h-full object-cover opacity-60"
              />
            </div>
          </div>
        </motion.div>

        {/* Featured In */}
        <div className="max-w-7xl mx-auto px-4 mt-20 text-center space-y-8">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Trusted by teams at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale invert">
            {['Vercel', 'Linear', 'OpenAI', 'Stripe', 'Framer', 'Notion'].map(logo => (
              <span key={logo} className="text-xl font-black italic">{logo}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Alex Rivera",
                role: "Content Creator",
                content: "ClipIQ AI has completely transformed my workflow. I used to spend hours editing shorts, now it takes 5 minutes.",
                avatar: "https://i.pravatar.cc/150?u=alex"
              },
              {
                name: "Sarah Chen",
                role: "Marketing Director",
                content: "The virality score is a game-changer. We've seen a 300% increase in reach since using ClipIQ.",
                avatar: "https://i.pravatar.cc/150?u=sarah"
              },
              {
                name: "Marcus Thorne",
                role: "Podcast Host",
                content: "The auto-captioning and smart zoom are flawless. It feels like having a professional editor on demand.",
                avatar: "https://i.pravatar.cc/150?u=marcus"
              }
            ].map((t, i) => (
              <div key={i} className="space-y-4 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex gap-1 text-yellow-500">
                  {[1, 2, 3, 4, 5].map(s => <Sparkles key={s} className="w-3 h-3 fill-current" />)}
                </div>
                <p className="text-sm italic text-white/80">"{t.content}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} className="w-10 h-10 rounded-full border border-white/10" alt={t.name} />
                  <div>
                    <h4 className="text-sm font-bold">{t.name}</h4>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <Badge variant="secondary" className="px-4 py-1 rounded-full bg-white/5 border-white/10 text-white/80">Process</Badge>
          <h2 className="text-3xl md:text-5xl font-bold">Three steps to virality.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              step: "01",
              title: "Import Video",
              description: "Paste your YouTube link or upload a video file directly to our secure platform."
            },
            {
              step: "02",
              title: "AI Analysis",
              description: "Our AI scans the content for high-energy moments, hooks, and impactful quotes."
            },
            {
              step: "03",
              title: "Export & Go Viral",
              description: "Review generated clips, customize captions, and export in 9:16 vertical format."
            }
          ].map((s, i) => (
            <div key={i} className="relative space-y-4 group">
              <div className="text-6xl font-black text-white/[0.03] absolute -top-10 -left-4 group-hover:text-white/[0.05] transition-colors">{s.step}</div>
              <h3 className="text-xl font-bold relative z-10">{s.title}</h3>
              <p className="text-muted-foreground relative z-10 leading-relaxed">{s.description}</p>
              <div className="h-1 w-12 bg-white/10 rounded-full group-hover:w-full group-hover:bg-white/20 transition-all duration-500" />
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">The smarter way to create.</h2>
          <p className="text-muted-foreground text-lg">AI-powered tools designed for modern creators.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Zap className="w-6 h-6 text-yellow-500" />,
              title: "Auto Captions",
              description: "Generate highly accurate, animated captions that keep viewers engaged."
            },
            {
              icon: <TrendingUp className="w-6 h-6 text-blue-500" />,
              title: "Virality Score",
              description: "Our AI predicts which clips have the highest potential to go viral."
            },
            {
              icon: <Layers className="w-6 h-6 text-purple-500" />,
              title: "Smart Zoom",
              description: "Automatically tracks faces and centers speakers for vertical formats."
            },
            {
              icon: <Share2 className="w-6 h-6 text-green-500" />,
              title: "One-Click Export",
              description: "Directly publish to TikTok, Reels, and YouTube Shorts."
            },
            {
              icon: <Sparkles className="w-6 h-6 text-orange-500" />,
              title: "AI B-Roll",
              description: "Automatically insert relevant stock footage to enhance your storytelling."
            },
            {
              icon: <Play className="w-6 h-6 text-pink-500" />,
              title: "Hook Generator",
              description: "Craft the perfect opening to hook your audience in the first 3 seconds."
            }
          ].map((feature, i) => (
            <Card key={i} className="bg-white/[0.02] border-white/5 hover:border-white/10 transition-colors group">
              <CardContent className="pt-6">
                <div className="mb-4 p-2 w-fit rounded-lg bg-white/5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold">Simple, transparent pricing.</h2>
          <p className="text-muted-foreground text-lg">Choose the plan that fits your growth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Starter",
              price: "$0",
              features: ["10 mins AI processing", "720p Exports", "Basic Captions", "Watermark included"],
              cta: "Get Started",
              popular: false
            },
            {
              name: "Pro",
              price: "$29",
              features: ["300 mins AI processing", "4K Ultra HD Exports", "Premium AI Captions", "No Watermark", "Priority Rendering"],
              cta: "Go Pro",
              popular: true
            },
            {
              name: "Creator",
              price: "$79",
              features: ["1200 mins AI processing", "All Pro features", "Custom Templates", "Team Collaboration", "API Access"],
              cta: "Scale Now",
              popular: false
            }
          ].map((plan, i) => (
            <Card key={i} className={cn(
              "bg-white/[0.02] border-white/5 relative flex flex-col",
              plan.popular && "border-white/20 bg-white/[0.04] scale-105 z-10"
            )}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white text-black text-[10px] font-bold rounded-full">
                  MOST POPULAR
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {f}
                  </div>
                ))}
              </CardContent>
              <div className="p-6 pt-0">
                <Button 
                  className={cn(
                    "w-full rounded-xl",
                    plan.popular ? "bg-white text-black" : "bg-white/5 text-white hover:bg-white/10"
                  )}
                  onClick={onGetStarted}
                >
                  {plan.cta}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {[
            { q: "How does the AI choose the best clips?", a: "Our AI analyzes audio and visual cues to identify high-energy moments, audience laughter, and impactful quotes that are likely to perform well on social media." },
            { q: "Can I edit the captions manually?", a: "Yes! You can fully customize font, color, style, and even edit the text and timing of the generated captions." },
            { q: "Which languages are supported?", a: "We currently support English, Spanish, French, German, and 20+ other major languages for transcription and captioning." },
            { q: "Is there a watermark on the free plan?", a: "Yes, free plan exports include a small ClipIQ watermark. Upgrading to any paid plan removes it." }
          ].map((faq, i) => (
            <div key={i} className="space-y-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <h4 className="font-semibold text-white">{faq.q}</h4>
              <p className="text-sm text-muted-foreground">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto glass-dark border border-white/10 rounded-[2rem] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -z-10" />
          <h2 className="text-4xl font-bold mb-6">Ready to scale your content?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join 10,000+ creators who are using ClipIQ AI to dominate social media.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} size="lg" className="rounded-full px-8 bg-white text-black hover:bg-white/90 group">
              Get Started for Free
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 border-white/10 hover:bg-white/5">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Zap className="text-white w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">ClipIQ AI</span>
          </div>
          <div className="flex gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-white">Twitter</a>
            <a href="#" className="hover:text-white">Discord</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 ClipIQ AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
