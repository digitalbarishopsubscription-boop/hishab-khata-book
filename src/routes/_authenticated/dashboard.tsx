import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  TrendingUp, Wallet, AlertCircle, Package,
  Plus, Users, ShoppingCart, BookOpen, Receipt, Activity, Bot, Bell, Loader2,
  ChevronLeft, ChevronRight, Store, LineChart, Smartphone, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const slides = [
  {
    icon: Store,
    title: "ছোট ব্যবসার সহজ হিসাব",
    desc: "দোকান, ক্যাফে বা ফ্রিল্যান্স — সব ধরনের ছোট ব্যবসার বিক্রয়, খরচ ও বাকি এক জায়গায়।",
    gradient: "from-primary to-primary-glow",
  },
  {
    icon: BookOpen,
    title: "ডিজিটাল খাতা ও বাকি",
    desc: "কাগজের খাতা ভুলে যান — কাস্টমার অনুযায়ী বাকি, পরিশোধ ও লেনদেন স্বয়ংক্রিয়ভাবে হিসাব হবে।",
    gradient: "from-purple-600 to-pink-500",
  },
  {
    icon: LineChart,
    title: "রিয়েল-টাইম ইনসাইট",
    desc: "দৈনিক ও মাসিক বিক্রয়, লাভ ও বাকি আদায়ের লাইভ চিত্র — ব্যবসার স্বাস্থ্য এক নজরে।",
    gradient: "from-fuchsia-600 to-primary",
  },
  {
    icon: ShieldCheck,
    title: "নিরাপদ ও ক্লাউড ব্যাকআপ",
    desc: "আপনার ডেটা সুরক্ষিত ক্লাউডে সংরক্ষিত — মোবাইল বা কম্পিউটার যেকোনো জায়গা থেকে অ্যাক্সেস।",
    gradient: "from-primary to-fuchsia-500",
  },
];

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "ড্যাশবোর্ড — হিসাব" }] }),
  component: Dashboard,
});

const bn = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const fmt = (n: number) => bn(n.toLocaleString("en-IN", { maximumFractionDigits: 2 }));

const toneClass: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  gold: "bg-gold/20 text-gold-foreground",
};

const quickActions = [
  { icon: Plus, label: "বিক্রয় এন্ট্রি", to: "/sales" as const },
  { icon: BookOpen, label: "খাতা এন্ট্রি", to: "/sales" as const },
  { icon: Users, label: "নতুন কাস্টমার", to: "/sales" as const },
  { icon: Receipt, label: "খরচ যোগ", to: "/sales" as const },
];

type Sale = {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  paid: number;
  due: number;
  sale_date: string;
};

type Stats = {
  todaySales: number;
  todayPaid: number;
  todayDue: number;
  totalReceivable: number;
  totalDueCollection: number;
  monthSales: number;
  monthCount: number;
  recent: Sale[];
};

const empty: Stats = {
  todaySales: 0, todayPaid: 0, todayDue: 0,
  totalReceivable: 0, totalDueCollection: 0, monthSales: 0, monthCount: 0, recent: [],
};

function Dashboard() {
  const { user } = useAuth();
  const name = (user?.user_metadata?.owner_name as string) || "মালিক";
  const [stats, setStats] = useState<Stats>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [{ data, error }, { data: payments }] = await Promise.all([
        supabase
          .from("sales")
          .select("id,invoice_number,customer_name,total,paid,due,sale_date")
          .order("sale_date", { ascending: false })
          .limit(500),
        supabase
          .from("khata_transactions")
          .select("amount,type")
          .eq("type", "payment"),
      ]);

      if (error) {
        setStats(empty);
        setLoading(false);
        return;
      }
      const rows = (data || []) as Sale[];
      const today = rows.filter((r) => r.sale_date >= startOfDay);
      const month = rows.filter((r) => r.sale_date >= startOfMonth);
      const khataPayments = (payments || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
      setStats({
        todaySales: today.reduce((s, r) => s + Number(r.total), 0),
        todayPaid: today.reduce((s, r) => s + Number(r.paid), 0),
        todayDue: today.reduce((s, r) => s + Number(r.due), 0),
        totalReceivable: rows.reduce((s, r) => s + Number(r.due), 0),
        totalDueCollection: khataPayments,
        monthSales: month.reduce((s, r) => s + Number(r.total), 0),
        monthCount: month.length,
        recent: rows.slice(0, 5),
      });
      setLoading(false);
    })();
  }, [user]);

  const kpis = [
    { label: "আজকের বিক্রয়", value: stats.todaySales, icon: ShoppingCart, tone: "primary" },
    { label: "আজকের পরিশোধিত", value: stats.todayPaid, icon: Wallet, tone: "success" },
    { label: "মোট পাবো (বাকি)", value: stats.totalReceivable, icon: AlertCircle, tone: "warning" },
    { label: "মোট বাকি আদায়", value: stats.totalDueCollection, icon: TrendingUp, tone: "gold" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-sm text-muted-foreground">আস্‌সালামু আলাইকুম 👋</p>
          <h1 className="text-display text-2xl sm:text-3xl font-bold text-foreground mt-1">{name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            আজ {bn(new Date().toLocaleDateString("en-US", { day: "numeric" }))} — এই হলো আপনার ব্যবসার অবস্থা
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full"><Bell className="size-4" /></Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/sales"><Plus className="size-4 mr-1.5" /> নতুন এন্ট্রি</Link>
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-primary p-5 sm:p-6 text-primary-foreground shadow-elegant mb-6">
        <div className="absolute -right-10 -top-10 size-48 rounded-full bg-gold/20 blur-2xl" />
        <div className="absolute -right-4 -bottom-12 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">এই মাসের সারসংক্ষেপ</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-display text-4xl sm:text-5xl font-extrabold">৳{fmt(stats.monthSales)}</span>
            </div>
            <div className="mt-1 text-sm opacity-90">
              {stats.monthCount > 0
                ? `${bn(stats.monthCount)} টি বিক্রয় এই মাসে`
                : "এই মাসে এখনো কোনো বিক্রয় নেই"}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-3.5 py-2.5">
            <Bot className="size-4" />
            <span className="text-sm">এআই পরামর্শ শীঘ্রই</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-card hover:shadow-elegant transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`size-9 rounded-xl grid place-items-center ${toneClass[k.tone]}`}>
                <k.icon className="size-4.5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-0.5 text-display text-xl sm:text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : `৳${fmt(k.value)}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 rounded-2xl bg-card border border-border p-5 shadow-card">
          <h3 className="text-display font-semibold text-foreground mb-3">দ্রুত অ্যাকশন</h3>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-secondary hover:bg-accent transition-colors text-center"
              >
                <div className="size-9 rounded-lg bg-gradient-primary grid place-items-center text-primary-foreground">
                  <a.icon className="size-4" />
                </div>
                <span className="text-xs font-medium text-foreground">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl bg-card border border-border p-5 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-display font-semibold text-foreground">সাম্প্রতিক বিক্রয়</h3>
            <Link to="/sales" className="text-xs text-primary font-medium hover:underline">সব দেখুন</Link>
          </div>
          {loading ? (
            <div className="py-10 grid place-items-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : stats.recent.length === 0 ? (
            <div className="py-10 text-center">
              <Package className="size-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">এখনো কোনো বিক্রয় যোগ করা হয়নি</p>
              <Button asChild size="sm" className="mt-3">
                <Link to="/sales"><Plus className="size-4 mr-1" /> প্রথম বিক্রয় যোগ করুন</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {stats.recent.map((r) => (
                <li key={r.id} className="py-3 flex items-center gap-3">
                  <div className="size-9 rounded-full bg-secondary grid place-items-center text-primary font-semibold text-sm shrink-0">
                    {r.customer_name[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.customer_name}</div>
                    <div className="text-xs text-muted-foreground truncate font-mono">{r.invoice_number}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold">৳{fmt(Number(r.total))}</div>
                    {Number(r.due) > 0 && (
                      <div className="text-[11px] text-destructive mt-0.5">বাকি ৳{fmt(Number(r.due))}</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
