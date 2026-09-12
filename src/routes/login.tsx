import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "লগইন — আপনার ব্যবসার হিসাবে প্রবেশ | হিসাব পত্র" },
      { name: "description", content: "হিসাব পত্র অ্যাকাউন্টে লগইন করে বিক্রয়, বাকি ও ইনভেন্টরি দেখুন।" },
      { property: "og:title", content: "লগইন — হিসাব পত্র" },
      { property: "og:description", content: "হিসাব পত্র অ্যাকাউন্টে লগইন করে বিক্রয়, বাকি ও ইনভেন্টরি দেখুন।" },
      { property: "og:url", content: "https://hishab-khata-book.lovable.app/login" },
    ],
    links: [{ rel: "canonical", href: "https://hishab-khata-book.lovable.app/login" }],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর").max(128),
});

function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "ইমেইল বা পাসওয়ার্ড ভুল" : error.message);
      return;
    }
    toast.success("সফলভাবে লগইন হয়েছে");
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setLoading(false);
      toast.error("Google লগইন ব্যর্থ হয়েছে");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Visual side */}
      <div className="hidden lg:flex relative bg-sidebar text-sidebar-foreground p-12 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sidebar via-sidebar to-primary-glow/30" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-primary-glow/30 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="হিসাব পত্র"
            className="h-10 w-auto rounded-lg bg-white p-0.5 shadow-sm"
          />
          <span className="font-bold text-xl text-display">হিসাব পত্র</span>
        </Link>
        <div className="relative">
          <h2 className="text-display text-4xl font-bold leading-tight">
            স্বাগতম<br />
            <span className="text-gold">আপনার ব্যবসায় ফিরে আসুন</span>
          </h2>
          <p className="mt-4 text-sidebar-foreground/70 max-w-md leading-relaxed">
            আজকের বিক্রয়, বাকি, ইনভেন্টরি — সব এক জায়গায় দেখুন এবং এআই সহকারীর সাহায্যে সঠিক সিদ্ধান্ত নিন।
          </p>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} হিসাব পত্র</div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="lg:hidden flex items-center gap-2.5 mb-8">
            <img
              src="/logo.png"
              alt="হিসাব পত্র"
              className="h-9 w-auto rounded-lg bg-white p-0.5 shadow-sm"
            />
            <span className="font-bold text-lg text-display">হিসাব পত্র</span>
          </Link>
          <h1 className="text-display text-3xl font-bold text-foreground">লগইন করুন</h1>
          <p className="mt-2 text-sm text-muted-foreground">আপনার মালিক অ্যাকাউন্টে প্রবেশ করুন</p>

          <Button type="button" variant="outline" className="w-full mt-8" onClick={onGoogle} disabled={loading}>
            <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Google দিয়ে চালিয়ে যান
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> অথবা <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />} লগইন করুন
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            অ্যাকাউন্ট নেই?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">সাইনআপ করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
