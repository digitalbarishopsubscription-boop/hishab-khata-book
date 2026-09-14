import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap, LayoutDashboard, ShoppingCart, Users, BookOpen, Package,
  Receipt, BarChart3, CheckCircle2, Circle, PlayCircle, Sparkles, RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/tutorial")({
  head: () => ({
    meta: [
      { title: "টিউটোরিয়াল — হিসাব পত্র" },
      { name: "description", content: "ধাপে ধাপে শিখুন কীভাবে হিসাব পত্র দিয়ে আপনার ব্যবসা চালাবেন।" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  staticData: { sitemap: false },
  component: TutorialPage,
});

const bn = (n: number) => String(Math.round(n)).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

type Lesson = {
  id: string;
  title: string;
  minutes: number;
  icon: any;
  summary: string;
  steps: string[];
};

const lessons: Lesson[] = [
  {
    id: "dashboard",
    title: "ড্যাশবোর্ড বুঝে নিন",
    minutes: 3,
    icon: LayoutDashboard,
    summary: "এক নজরে আয়, ব্যয়, বাকি ও আজকের বিক্রয় দেখার নিয়ম।",
    steps: [
      "সাইডবার থেকে ড্যাশবোর্ড খুলুন।",
      "উপরের কার্ডগুলোতে মোট বিক্রয়, খরচ ও লাভ দেখুন।",
      "নিচের তালিকায় সাম্প্রতিক লেনদেন যাচাই করুন।",
    ],
  },
  {
    id: "sales",
    title: "প্রথম বিক্রয় এন্ট্রি",
    minutes: 4,
    icon: ShoppingCart,
    summary: "নগদ বা বাকিতে বিক্রয় লিখে ইনভয়েস তৈরি করুন।",
    steps: [
      "বিক্রয় পেজে যান এবং নতুন বিক্রয় ফর্ম পূরণ করুন।",
      "কাস্টমার বাছাই করুন অথবা ওয়াক-ইন রাখুন।",
      "পণ্য, পরিমাণ ও দাম দিন, তারপর সেভ করুন।",
      "প্রয়োজনে ইনভয়েস প্রিন্ট করুন।",
    ],
  },
  {
    id: "customers",
    title: "কাস্টমার ব্যবস্থাপনা",
    minutes: 3,
    icon: Users,
    summary: "গ্রাহক যোগ করা, খোঁজা ও প্রোফাইল দেখা।",
    steps: [
      "কাস্টমার পেজে নতুন গ্রাহক যোগ করুন।",
      "নাম বা ফোন দিয়ে দ্রুত খুঁজুন।",
      "কার্ডে ক্লিক করে পুরো লেনদেন ইতিহাস দেখুন।",
    ],
  },
  {
    id: "khata",
    title: "খাতা ও বাকি আদায়",
    minutes: 5,
    icon: BookOpen,
    summary: "বাকি লেখা, পেমেন্ট গ্রহণ ও ব্যালেন্স মেলানো।",
    steps: [
      "খাতা পেজে গ্রাহক নির্বাচন করুন।",
      "নতুন বাকি বা জমা এন্ট্রি দিন।",
      "পেমেন্ট গ্রহণ পেজ থেকে টাকা আদায় লিখুন।",
      "ব্যালেন্স শূন্য হলে হিসাব মিলে গেছে।",
    ],
  },
  {
    id: "inventory",
    title: "ইনভেন্টরি ও স্টক",
    minutes: 4,
    icon: Package,
    summary: "পণ্য যোগ, স্টক আপডেট ও কম স্টকের সতর্কতা।",
    steps: [
      "ইনভেন্টরি পেজে পণ্য যোগ করুন।",
      "ক্রয় মূল্য ও বিক্রয় মূল্য দিন।",
      "কম স্টক অ্যালার্টের সীমা নির্ধারণ করুন।",
    ],
  },
  {
    id: "expenses",
    title: "খরচ লিপিবদ্ধ করা",
    minutes: 2,
    icon: Receipt,
    summary: "দোকান ভাড়া, বিদ্যুৎ ও অন্যান্য খরচ ঠিকভাবে লেখা।",
    steps: [
      "খরচ পেজে নতুন খরচ যোগ করুন।",
      "ক্যাটাগরি ও তারিখ নির্বাচন করুন।",
      "প্রতি মাসে খরচের সারাংশ দেখুন।",
    ],
  },
  {
    id: "reports",
    title: "রিপোর্ট পড়া",
    minutes: 4,
    icon: BarChart3,
    summary: "লাভ-ক্ষতি ও বিক্রয় রিপোর্ট থেকে সিদ্ধান্ত নেওয়া।",
    steps: [
      "রিপোর্ট পেজে সময়সীমা বাছুন।",
      "বিক্রয়, খরচ ও লাভ তুলনা করুন।",
      "সেরা বিক্রিত পণ্য চিহ্নিত করুন।",
    ],
  },
];

const STORAGE_KEY = "hishab-tutorial-progress";

function TutorialPage() {
  const [done, setDone] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string>(lessons[0]!.id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
  }, [done, ready]);

  const active = useMemo(() => lessons.find((l) => l.id === activeId) ?? lessons[0]!, [activeId]);
  const completed = done.length;
  const percent = Math.round((completed / lessons.length) * 100);
  const next = lessons.find((l) => !done.includes(l.id));

  const toggle = (id: string) =>
    setDone((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <header className="relative overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 md:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="size-12 shrink-0 rounded-xl bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-primary-foreground shadow-lg">
              <GraduationCap className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-display">টিউটোরিয়াল</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                ধাপে ধাপে শিখুন কীভাবে হিসাব পত্র দিয়ে আপনার দোকান বা ব্যবসার পুরো হিসাব রাখবেন।
              </p>
            </div>
          </div>
          <div className="min-w-[14rem] rounded-xl border border-primary/15 bg-card/70 p-4 backdrop-blur">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Sparkles className="size-3" /> অগ্রগতি</span>
              <span>{bn(completed)}/{bn(lessons.length)}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 text-lg font-bold text-display text-primary">{bn(percent)}% সম্পন্ন</div>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2">
          <Button
            onClick={() => next && setActiveId(next.id)}
            disabled={!next}
            className="gap-2"
          >
            <PlayCircle className="size-4" />
            {completed === 0 ? "শুরু করুন" : next ? "পরবর্তী পাঠ" : "সব পাঠ শেষ 🎉"}
          </Button>
          {completed > 0 && (
            <Button variant="outline" className="gap-2" onClick={() => setDone([])}>
              <RotateCcw className="size-4" /> রিসেট
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card className="border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">পাঠসমূহ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lessons.map((l, i) => {
              const isDone = done.includes(l.id);
              const isActive = l.id === activeId;
              return (
                <button
                  key={l.id}
                  onClick={() => setActiveId(l.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 rounded-xl border p-3 transition-colors",
                    isActive
                      ? "border-primary/40 bg-primary/10"
                      : "border-border hover:bg-accent/60",
                  )}
                >
                  <div
                    className={cn(
                      "size-9 shrink-0 rounded-lg grid place-items-center",
                      isDone ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                    )}
                  >
                    <l.icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {bn(i + 1)}. {l.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {bn(l.minutes)} মিনিট · {l.summary}
                    </div>
                  </div>
                  {isDone ? (
                    <CheckCircle2 className="size-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="size-4 text-muted-foreground/50 shrink-0" />
                  )}
                </button>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <active.icon className="size-4 text-primary" /> {active.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{active.summary}</p>
            <ol className="space-y-3">
              {active.steps.map((s, i) => (
                <li key={s} className="flex gap-3">
                  <span className="mt-0.5 size-6 shrink-0 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">
                    {bn(i + 1)}
                  </span>
                  <span className="text-sm leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
            <Button
              variant={done.includes(active.id) ? "outline" : "default"}
              className="w-full gap-2"
              onClick={() => toggle(active.id)}
            >
              <CheckCircle2 className="size-4" />
              {done.includes(active.id) ? "সম্পন্ন চিহ্ন সরান" : "সম্পন্ন হিসেবে চিহ্নিত করুন"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
