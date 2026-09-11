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

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "সাইনআপ — হিসাব পত্র" }] }),
  component: SignupPage,
});

const schema = z.object({
  ownerName: z.string().trim().min(2, "মালিকের নাম দিন").max(100),
  businessName: z.string().trim().min(2, "ব্যবসার নাম দিন").max(100),
  email: z.string().trim().email("সঠিক ইমেইল দিন").max(255),
  password: z
    .string()
    .min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে")
    .max(128)
    .regex(/[A-Za-z]/, "পাসওয়ার্ডে অন্তত একটি অক্ষর রাখুন")
    .regex(/[0-9]/, "পাসওয়ার্ডে অন্তত একটি সংখ্যা রাখুন"),
});

function banglaAuthError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("weak") || m.includes("pwned"))
    return "এই পাসওয়ার্ডটি খুব সহজ ও ফাঁস হওয়া পাসওয়ার্ডের তালিকায় আছে। অক্ষর, সংখ্যা ও চিহ্ন মিলিয়ে নতুন একটি পাসওয়ার্ড দিন।";
  if (m.includes("already registered") || m.includes("already been registered") || m.includes("user already"))
    return "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে। লগইন করুন।";
  if (m.includes("invalid email") || m.includes("email address"))
    return "ইমেইল ঠিকানাটি সঠিক নয়। আবার দেখুন।";
  if (m.includes("rate limit") || m.includes("too many"))
    return "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।";
  if (m.includes("password"))
    return "পাসওয়ার্ড গ্রহণযোগ্য নয়। কমপক্ষে ৮ অক্ষর, সংখ্যা ও চিহ্ন মিলিয়ে দিন।";
  return message;
}

function SignupPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ownerName, setOwner] = useState("");
  const [businessName, setBiz] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ ownerName, businessName, email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { owner_name: parsed.data.ownerName, business_name: parsed.data.businessName, role: "owner" },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(banglaAuthError(error.message));
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে। লগইন করুন।");
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    navigate({ to: "/verify-email", search: { email: parsed.data.email }, replace: true });
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setLoading(false);
      toast.error("Google সাইনআপ ব্যর্থ");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
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
            ব্যবসা সেটআপ<br />
            <span className="text-gold">শুরু করুন আজই</span>
          </h2>
          <p className="mt-4 text-sidebar-foreground/70 max-w-md leading-relaxed">
            শুধুমাত্র প্রথম মালিকের অ্যাকাউন্ট তৈরি করুন। পরে কর্মচারী ও ম্যানেজার আপনি নিজেই যোগ করতে পারবেন।
          </p>
          <ul className="mt-6 space-y-2 text-sm text-sidebar-foreground/80">
            <li className="flex gap-2"><span className="text-gold">✓</span> মালিক-নিয়ন্ত্রিত ইউজার ম্যানেজমেন্ট</li>
            <li className="flex gap-2"><span className="text-gold">✓</span> সম্পূর্ণ বাংলা ইন্টারফেস</li>
            <li className="flex gap-2"><span className="text-gold">✓</span> ক্লাউড সিঙ্ক ও অটো ব্যাকআপ</li>
          </ul>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">© {new Date().getFullYear()} হিসাব পত্র</div>
      </div>

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
          <h1 className="text-display text-3xl font-bold text-foreground">মালিক অ্যাকাউন্ট তৈরি করুন</h1>
          <p className="mt-2 text-sm text-muted-foreground">কয়েক সেকেন্ডে আপনার ব্যবসা সেটআপ করুন</p>

          <Button type="button" variant="outline" className="w-full mt-8" onClick={onGoogle} disabled={loading}>
            <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Google দিয়ে সাইনআপ
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> অথবা <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="owner">মালিকের নাম</Label>
              <Input id="owner" required value={ownerName} onChange={(e) => setOwner(e.target.value)} placeholder="আপনার নাম" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="biz">ব্যবসার নাম</Label>
              <Input id="biz" required value={businessName} onChange={(e) => setBiz(e.target.value)} placeholder="যেমন: রহিম স্টোর" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="কমপক্ষে ৮ অক্ষর, অক্ষর ও সংখ্যা মিলিয়ে" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />} অ্যাকাউন্ট তৈরি করুন
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            ইতিমধ্যে অ্যাকাউন্ট আছে?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">লগইন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
